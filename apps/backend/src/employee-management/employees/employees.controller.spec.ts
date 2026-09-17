import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { Reflector } from '@nestjs/core';
import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';

describe('employee CSV upload', () => {
  const create = jest.fn();
  const controller = new EmployeesController({
    createEmployeeMinimal: create,
  } as unknown as EmployeesService);
  const upload = (csv: string) =>
    controller.uploadCsv({ buffer: Buffer.from(csv) } as Express.Multer.File, {
      sub: 'writer',
      orgId: 'org',
    });
  beforeEach(() => create.mockReset().mockResolvedValue({ id: 'employee' }));

  it('requires employee write permission on the guarded endpoint', () => {
    // Inspect decorator metadata without invoking the unbound method.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(new Reflector().get(PERMS_KEY, controller.uploadCsv)).toContain(
      'EMPLOYEE_WRITE',
    );
  });
  it('rejects malformed structure before creating any employee', async () => {
    await expect(
      upload('email;firstName;lastName\na@b.ch;A;B\nc@d.ch;C'),
    ).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
  });
  it('validates each row and preserves partial import semantics', async () => {
    const result = await upload(
      'email;firstName;lastName;dateOfBirth\na@b.ch;A;B;2000-02-29\nbad;C;D;2000-02-30\nc@d.ch; ;D;2000-01-01',
    );
    expect(result.created).toEqual([{ email: 'a@b.ch' }]);
    expect(result.failed).toHaveLength(2);
    expect(create).toHaveBeenCalledTimes(1);
  });
  it('normalizes email and catches duplicate rows', async () => {
    const result = await upload(
      'email;firstName;lastName\n A@B.CH ;A;B\na@b.ch;A;B',
    );
    expect(result.created).toEqual([{ email: 'a@b.ch' }]);
    expect(result.failed[0].reason).toContain('Duplicate');
    expect(create).toHaveBeenCalledTimes(1);
  });
  it('never returns database internals', async () => {
    create.mockRejectedValue(new Error('secret SQL constraint detail'));
    const result = await upload('email;firstName;lastName\na@b.ch;A;B');
    expect(result.failed).toEqual([
      { row: 2, email: 'a@b.ch', reason: 'Employee could not be created' },
    ]);
  });
});
