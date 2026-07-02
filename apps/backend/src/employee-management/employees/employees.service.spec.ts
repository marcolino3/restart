import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { EmployeesService } from './employees.service';
import { Employee } from './entities/employee.entity';
import { PasswordService } from '@/users/password.service';
import { EmployeeAuditLogService } from '../employee-audit-log/employee-audit-log.service';
import { EmployeeAuditLogEntityType } from '../employee-audit-log/entities/employee-audit-log.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { UserEmail } from '@/user-emails/entities/user-email.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Persona } from '@/common/enums/persona.enum';
import { CreateEmployeeInput } from './dto/create-employee.input';

type MockManager = {
  findOne: jest.Mock;
  findOneBy: jest.Mock;
  findOneOrFail: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

describe('EmployeesService', () => {
  let service: EmployeesService;
  let entityManager: { transaction: jest.Mock };
  let auditLogService: { logChanges: jest.Mock };
  let employeeRepo: { find: jest.Mock; findOne: jest.Mock };
  let manager: MockManager;

  beforeEach(async () => {
    manager = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      findOneOrFail: jest.fn(),
      create: jest.fn((_entity: unknown, data: unknown) => data),
      save: jest.fn((_entity: unknown, data: unknown) => Promise.resolve(data)),
    };
    entityManager = {
      transaction: jest.fn(
        (cb: (m: EntityManager) => Promise<unknown>): Promise<unknown> =>
          cb(manager as unknown as EntityManager),
      ),
    };
    auditLogService = { logChanges: jest.fn().mockResolvedValue(undefined) };
    employeeRepo = { find: jest.fn(), findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: EntityManager, useValue: entityManager },
        { provide: PasswordService, useValue: {} },
        { provide: EmployeeAuditLogService, useValue: auditLogService },
        { provide: getRepositoryToken(Employee), useValue: employeeRepo },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findEmployeesByOrgId', () => {
    it('filters employees by the given organization id (multi-tenant isolation)', async () => {
      const employees = [{ id: 'emp-1' }];
      employeeRepo.find.mockResolvedValue(employees);

      const result = await service.findEmployeesByOrgId('org-1');

      expect(result).toBe(employees);
      expect(employeeRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { membership: { organizationId: 'org-1' } },
        }),
      );
    });
  });

  describe('findTeachersByOrgId', () => {
    it('only returns active teachers of the given organization', async () => {
      employeeRepo.find.mockResolvedValue([]);

      await service.findTeachersByOrgId('org-1');

      expect(employeeRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
            membership: {
              organizationId: 'org-1',
              persona: Persona.TEACHER,
              isActive: true,
            },
          },
        }),
      );
    });
  });

  describe('findEmployeeById', () => {
    it('throws NotFoundException when the employee does not exist', async () => {
      employeeRepo.findOne.mockResolvedValue(null);

      await expect(
        service.findEmployeeById('emp-1', 'org-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException when the employee belongs to a foreign org (multi-tenant isolation)', async () => {
      employeeRepo.findOne.mockResolvedValue({
        id: 'emp-1',
        membership: { organizationId: 'other-org' },
      });

      await expect(
        service.findEmployeeById('emp-1', 'org-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the employee when it belongs to the given org', async () => {
      const employee = {
        id: 'emp-1',
        membership: { organizationId: 'org-1' },
      };
      employeeRepo.findOne.mockResolvedValue(employee);

      await expect(service.findEmployeeById('emp-1', 'org-1')).resolves.toBe(
        employee,
      );
    });
  });

  describe('createEmployeeMinimal', () => {
    const input = {
      email: 'Jane.Doe@Example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      persona: Persona.EMPLOYEE,
    } as CreateEmployeeInput;

    it('throws NotFoundException when the organization does not exist', async () => {
      manager.findOne.mockImplementation((entity: unknown) => {
        if (entity === Organization) return Promise.resolve(null);
        return Promise.resolve(null);
      });

      await expect(
        service.createEmployeeMinimal(input, 'org-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ConflictException when the membership already has an employee', async () => {
      manager.findOne.mockImplementation((entity: unknown) => {
        if (entity === Organization) return Promise.resolve({ id: 'org-1' });
        if (entity === UserEmail)
          return Promise.resolve({ id: 'ue-1', userId: 'user-1' });
        if (entity === Membership)
          return Promise.resolve({ id: 'mem-1', employeeId: 'emp-existing' });
        return Promise.resolve(null);
      });
      manager.findOneBy.mockResolvedValue({ id: 'user-1' });

      await expect(
        service.createEmployeeMinimal(input, 'org-1'),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('updateEmployeeMinimal', () => {
    const buildEmployee = (organizationId: string) => ({
      id: 'emp-1',
      timeTrackingEnabled: false,
      membership: {
        id: 'mem-1',
        organizationId,
        persona: Persona.EMPLOYEE,
        contactPhone: null,
        user: { id: 'user-1', firstName: 'Old', lastName: 'Doe' },
      },
    });

    it('throws NotFoundException when the employee belongs to a foreign org (multi-tenant isolation)', async () => {
      manager.findOne.mockResolvedValue(buildEmployee('other-org'));

      await expect(
        service.updateEmployeeMinimal(
          { id: 'emp-1', firstName: 'New' },
          'org-1',
          'actor-1',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(auditLogService.logChanges).not.toHaveBeenCalled();
    });

    it('persists changed user fields and writes an audit log entry', async () => {
      const employee = buildEmployee('org-1');
      manager.findOne.mockResolvedValue(employee);
      manager.findOneOrFail.mockResolvedValue(employee);

      const result = await service.updateEmployeeMinimal(
        { id: 'emp-1', firstName: 'New' },
        'org-1',
        'actor-1',
      );

      expect(result).toBe(employee);
      expect(employee.membership.user.firstName).toBe('New');
      expect(auditLogService.logChanges).toHaveBeenCalledWith(
        'emp-1',
        'org-1',
        'actor-1',
        [
          expect.objectContaining({
            entityType: EmployeeAuditLogEntityType.USER,
            fieldName: 'firstName',
            oldValue: 'Old',
            newValue: 'New',
          }),
        ],
        manager,
      );
    });

    it('does not write an audit log entry when nothing changed', async () => {
      const employee = buildEmployee('org-1');
      manager.findOne.mockResolvedValue(employee);
      manager.findOneOrFail.mockResolvedValue(employee);

      await service.updateEmployeeMinimal(
        { id: 'emp-1', firstName: 'Old' },
        'org-1',
        'actor-1',
      );

      expect(auditLogService.logChanges).not.toHaveBeenCalled();
      expect(manager.save).not.toHaveBeenCalled();
    });
  });
});
