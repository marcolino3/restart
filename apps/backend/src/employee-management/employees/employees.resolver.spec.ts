import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EmployeesResolver } from './employees.resolver';
import { EmployeesService } from './employees.service';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { CreateEmployeeInput } from './dto/create-employee.input';
import { UpdateEmployeeInput } from './dto/update-employee.input';

describe('EmployeesResolver', () => {
  let resolver: EmployeesResolver;
  let employeesService: {
    createEmployeeMinimal: jest.Mock;
    updateEmployeeMinimal: jest.Mock;
    findEmployeesByOrgId: jest.Mock;
    findTeachersByOrgId: jest.Mock;
    findEmployeeById: jest.Mock;
  };

  beforeEach(async () => {
    employeesService = {
      createEmployeeMinimal: jest.fn(),
      updateEmployeeMinimal: jest.fn(),
      findEmployeesByOrgId: jest.fn(),
      findTeachersByOrgId: jest.fn(),
      findEmployeeById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesResolver,
        { provide: EmployeesService, useValue: employeesService },
      ],
    })
      .overrideGuard(GqlBetterAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GraphQLAccessGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<EmployeesResolver>(EmployeesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createEmployee', () => {
    it('delegates to the service with the current org id from the session', async () => {
      const input = {
        email: 'jane.doe@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
      } as CreateEmployeeInput;
      const created = { id: 'emp-1' };
      employeesService.createEmployeeMinimal.mockResolvedValue(created);

      await expect(resolver.createEmployee(input, 'org-1')).resolves.toBe(
        created,
      );
      expect(employeesService.createEmployeeMinimal).toHaveBeenCalledWith(
        input,
        'org-1',
      );
    });
  });

  describe('updateEmployee', () => {
    const input = { id: 'emp-1', firstName: 'New' } as UpdateEmployeeInput;

    it('delegates with org id and the actor membership id', async () => {
      const updated = { id: 'emp-1' };
      employeesService.updateEmployeeMinimal.mockResolvedValue(updated);

      await expect(
        resolver.updateEmployee(input, 'org-1', {
          sub: 'user-1',
          membershipId: 'mem-1',
        }),
      ).resolves.toBe(updated);
      expect(employeesService.updateEmployeeMinimal).toHaveBeenCalledWith(
        input,
        'org-1',
        'mem-1',
      );
    });

    it('passes null as actor when no membership id is present', async () => {
      employeesService.updateEmployeeMinimal.mockResolvedValue({ id: 'emp-1' });

      await resolver.updateEmployee(input, 'org-1', undefined);

      expect(employeesService.updateEmployeeMinimal).toHaveBeenCalledWith(
        input,
        'org-1',
        null,
      );
    });
  });

  describe('findEmployeesByOrgId', () => {
    it('scopes the query to the current org id (multi-tenant isolation)', async () => {
      const employees = [{ id: 'emp-1' }];
      employeesService.findEmployeesByOrgId.mockResolvedValue(employees);

      await expect(resolver.findEmployeesByOrgId('org-1')).resolves.toBe(
        employees,
      );
      expect(employeesService.findEmployeesByOrgId).toHaveBeenCalledWith(
        'org-1',
      );
    });
  });

  describe('findTeachersByOrgId', () => {
    it('scopes the query to the current org id', async () => {
      employeesService.findTeachersByOrgId.mockResolvedValue([]);

      await resolver.findTeachersByOrgId('org-1');

      expect(employeesService.findTeachersByOrgId).toHaveBeenCalledWith(
        'org-1',
      );
    });
  });

  describe('findEmployeeById', () => {
    it('delegates with employee id and the current org id', async () => {
      const employee = { id: 'emp-1' };
      employeesService.findEmployeeById.mockResolvedValue(employee);

      await expect(resolver.findEmployeeById('emp-1', 'org-1')).resolves.toBe(
        employee,
      );
      expect(employeesService.findEmployeeById).toHaveBeenCalledWith(
        'emp-1',
        'org-1',
      );
    });

    it('propagates NotFoundException for employees of a foreign org (multi-tenant isolation)', async () => {
      employeesService.findEmployeeById.mockRejectedValue(
        new NotFoundException('Employee not found'),
      );

      await expect(
        resolver.findEmployeeById('emp-of-other-org', 'org-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
