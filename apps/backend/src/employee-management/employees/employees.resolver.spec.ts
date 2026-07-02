import { Test, TestingModule } from '@nestjs/testing';

import { EmployeesResolver } from './employees.resolver';
import { EmployeesService } from './employees.service';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';
import { ADMIN_PERSONA_KEY } from '@/auth/decorators/admin-persona-only.decorator';
import {
  TEST_ORG_ID,
  guardsOf,
  methodOf,
  mockUser,
  overrideAllAuthGuards,
} from '@/common/testing/auth-test.util';
import { CreateEmployeeInput } from './dto/create-employee.input';
import { UpdateEmployeeInput } from './dto/update-employee.input';

describe('EmployeesResolver', () => {
  let resolver: EmployeesResolver;
  let service: {
    createEmployeeMinimal: jest.Mock;
    updateEmployeeMinimal: jest.Mock;
    findEmployeesByOrgId: jest.Mock;
    findTeachersByOrgId: jest.Mock;
    findEmployeeById: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      createEmployeeMinimal: jest.fn(),
      updateEmployeeMinimal: jest.fn(),
      findEmployeesByOrgId: jest.fn(),
      findTeachersByOrgId: jest.fn(),
      findEmployeeById: jest.fn(),
    };

    const module: TestingModule = await overrideAllAuthGuards(
      Test.createTestingModule({
        providers: [
          EmployeesResolver,
          { provide: EmployeesService, useValue: service },
        ],
      }),
    ).compile();

    resolver = module.get<EmployeesResolver>(EmployeesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  // ── guard wiring ─────────────────────────────────────────────────
  describe('authorization metadata', () => {
    it('gates the whole resolver behind auth + access guards', () => {
      const guards = guardsOf(EmployeesResolver);
      expect(guards).toContain(GqlBetterAuthGuard);
      expect(guards).toContain(GraphQLAccessGuard);
    });

    it.each([
      ['createEmployee', 'EMPLOYEE_WRITE'],
      ['updateEmployee', 'EMPLOYEE_WRITE'],
      ['findEmployeesByOrgId', 'EMPLOYEE_READ'],
      ['findTeachersByOrgId', 'SCHOOL_CLASS_READ'],
      ['findEmployeeById', 'EMPLOYEE_READ'],
    ] as const)('requires %s -> %s permission', (method, permission) => {
      const perms = Reflect.getMetadata(
        PERMS_KEY,
        methodOf(EmployeesResolver, method),
      ) as string[];
      expect(perms).toEqual([permission]);
    });

    it.each(['createEmployee', 'updateEmployee', 'findEmployeeById'] as const)(
      'restricts %s to admin personas',
      (method) => {
        const flag = Reflect.getMetadata(
          ADMIN_PERSONA_KEY,
          methodOf(EmployeesResolver, method as keyof EmployeesResolver),
        ) as boolean;
        expect(flag).toBe(true);
      },
    );
  });

  // ── delegation (org id sourced from session, never from client) ──
  describe('delegation', () => {
    it('createEmployee forwards input + active org id', async () => {
      const input = { firstName: 'Ada' } as CreateEmployeeInput;
      service.createEmployeeMinimal.mockResolvedValue({ id: 'emp-1' });

      await resolver.createEmployee(input, TEST_ORG_ID);

      expect(service.createEmployeeMinimal).toHaveBeenCalledWith(
        input,
        TEST_ORG_ID,
      );
    });

    it('updateEmployee forwards input, org id and actor membership id', async () => {
      const input = { id: 'emp-1', firstName: 'Ada' } as UpdateEmployeeInput;
      const actor = mockUser({ membershipId: 'membership-9' });
      service.updateEmployeeMinimal.mockResolvedValue({ id: 'emp-1' });

      await resolver.updateEmployee(input, TEST_ORG_ID, actor);

      expect(service.updateEmployeeMinimal).toHaveBeenCalledWith(
        input,
        TEST_ORG_ID,
        'membership-9',
      );
    });

    it('updateEmployee passes null membership id when actor is missing', async () => {
      const input = { id: 'emp-1' } as UpdateEmployeeInput;
      service.updateEmployeeMinimal.mockResolvedValue({ id: 'emp-1' });

      await resolver.updateEmployee(input, TEST_ORG_ID, undefined);

      expect(service.updateEmployeeMinimal).toHaveBeenCalledWith(
        input,
        TEST_ORG_ID,
        null,
      );
    });

    it('findEmployeesByOrgId forwards the active org id', async () => {
      service.findEmployeesByOrgId.mockResolvedValue([]);
      await resolver.findEmployeesByOrgId(TEST_ORG_ID);
      expect(service.findEmployeesByOrgId).toHaveBeenCalledWith(TEST_ORG_ID);
    });

    it('findTeachersByOrgId forwards the active org id', async () => {
      service.findTeachersByOrgId.mockResolvedValue([]);
      await resolver.findTeachersByOrgId(TEST_ORG_ID);
      expect(service.findTeachersByOrgId).toHaveBeenCalledWith(TEST_ORG_ID);
    });

    it('findEmployeeById forwards employee id + active org id', async () => {
      service.findEmployeeById.mockResolvedValue({ id: 'emp-1' });
      await resolver.findEmployeeById('emp-1', TEST_ORG_ID);
      expect(service.findEmployeeById).toHaveBeenCalledWith(
        'emp-1',
        TEST_ORG_ID,
      );
    });
  });
});
