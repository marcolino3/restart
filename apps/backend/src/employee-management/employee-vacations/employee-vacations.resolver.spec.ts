import { EmployeeVacationsResolver } from './employee-vacations.resolver';
import { EmployeeVacationsService } from './employee-vacations.service';
import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';

describe('EmployeeVacationsResolver', () => {
  let resolver: EmployeeVacationsResolver;
  let service: {
    findByEmployee: jest.Mock;
    findSegmentsForEmployee: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };
  beforeEach(() => {
    service = {
      findByEmployee: jest.fn(),
      findSegmentsForEmployee: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    resolver = new EmployeeVacationsResolver(
      service as unknown as EmployeeVacationsService,
    );
  });

  const permissionsOf = (methodName: keyof EmployeeVacationsResolver) => {
    const descriptor = Object.getOwnPropertyDescriptor(
      EmployeeVacationsResolver.prototype,
      methodName,
    );
    return Reflect.getMetadata(
      PERMS_KEY,
      descriptor?.value as object,
    ) as string[];
  };

  it('requires TIMESHEET_READ for both queries', () => {
    expect(permissionsOf('employeeVacations')).toEqual(['TIMESHEET_READ']);
    expect(permissionsOf('employeeVacationSegments')).toEqual([
      'TIMESHEET_READ',
    ]);
  });

  it('requires TIMESHEET_WRITE for all mutations', () => {
    expect(permissionsOf('createEmployeeVacation')).toEqual([
      'TIMESHEET_WRITE',
    ]);
    expect(permissionsOf('updateEmployeeVacation')).toEqual([
      'TIMESHEET_WRITE',
    ]);
    expect(permissionsOf('deleteEmployeeVacation')).toEqual([
      'TIMESHEET_WRITE',
    ]);
  });

  it('delegates queries and mutations to the service', () => {
    const user = { orgId: 'org-a' } as never;

    void resolver.employeeVacations(user, 'emp-1');
    expect(service.findByEmployee).toHaveBeenCalledWith(user, 'emp-1');

    void resolver.employeeVacationSegments(user, 'emp-1');
    expect(service.findSegmentsForEmployee).toHaveBeenCalledWith(user, 'emp-1');

    const createInput = {
      employeeId: 'emp-1',
      startDate: '2026-07-01',
      endDate: '2026-07-10',
    };
    void resolver.createEmployeeVacation(createInput, user);
    expect(service.create).toHaveBeenCalledWith(createInput, user);

    const updateInput = { id: 'ev-1', startDate: '2026-07-02' };
    void resolver.updateEmployeeVacation(updateInput, user);
    expect(service.update).toHaveBeenCalledWith(updateInput, user);

    void resolver.deleteEmployeeVacation('ev-1', user);
    expect(service.remove).toHaveBeenCalledWith('ev-1', user);
  });
});
