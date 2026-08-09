import { Test, TestingModule } from '@nestjs/testing';

import { CompanyVacationAssignmentsResolver } from './company-vacation-assignments.resolver';
import { CompanyVacationAssignmentsService } from './company-vacation-assignments.service';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';

const methodOf = (name: keyof CompanyVacationAssignmentsResolver): object =>
  Object.getOwnPropertyDescriptor(
    CompanyVacationAssignmentsResolver.prototype,
    name,
  )?.value as object;

describe('CompanyVacationAssignmentsResolver', () => {
  let resolver: CompanyVacationAssignmentsResolver;
  let service: {
    findForEmployee: jest.Mock;
    assign: jest.Mock;
    unassign: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findForEmployee: jest.fn(),
      assign: jest.fn(),
      unassign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyVacationAssignmentsResolver,
        { provide: CompanyVacationAssignmentsService, useValue: service },
      ],
    })
      .overrideGuard(GqlBetterAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GraphQLAccessGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get(CompanyVacationAssignmentsResolver);
  });

  it('authenticates the whole resolver', () => {
    const guards: unknown[] =
      Reflect.getMetadata('__guards__', CompanyVacationAssignmentsResolver) ??
      [];
    expect(guards).toEqual(
      expect.arrayContaining([GqlBetterAuthGuard, GraphQLAccessGuard]),
    );
  });

  it.each([
    ['companyVacationsForEmployee', 'TIMESHEET_READ'],
    ['assignCompanyVacationToEmployee', 'EMPLOYEE_WRITE'],
    ['unassignCompanyVacationFromEmployee', 'EMPLOYEE_WRITE'],
  ] as const)('%s requires permission %s', (method, permission) => {
    const permissions: string[] =
      Reflect.getMetadata(PERMS_KEY, methodOf(method)) ?? [];
    expect(permissions).toContain(permission);
  });

  it('scopes companyVacationsForEmployee to the active org id (multi-tenant isolation)', async () => {
    service.findForEmployee.mockResolvedValue([]);
    await resolver.companyVacationsForEmployee('emp-1', 'org-a');
    expect(service.findForEmployee).toHaveBeenCalledWith('emp-1', 'org-a');
  });

  it('scopes assign to the active org id', async () => {
    service.assign.mockResolvedValue({ id: 'assignment-1' });
    await resolver.assignCompanyVacationToEmployee('cv-1', 'emp-1', 'org-a');
    expect(service.assign).toHaveBeenCalledWith('cv-1', 'emp-1', 'org-a');
  });

  it('scopes unassign to the active org id', async () => {
    service.unassign.mockResolvedValue(true);
    await resolver.unassignCompanyVacationFromEmployee(
      'cv-1',
      'emp-1',
      'org-a',
    );
    expect(service.unassign).toHaveBeenCalledWith('cv-1', 'emp-1', 'org-a');
  });
});
