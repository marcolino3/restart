import { EmployeeStorageCleanupService } from './employee-storage-cleanup.service';
import { EmployeeStorageCleanup } from './entities/employee-storage-cleanup.entity';

describe('committed employee photo cleanup', () => {
  const job = {
    employeeId: 'c567f000-029e-44fb-b1b8-21c35014a454',
    organizationId: 'org',
  };
  const manager = { find: jest.fn(), delete: jest.fn() };
  const storage = { delete: jest.fn() };
  const service = new EmployeeStorageCleanupService(
    manager as never,
    storage as never,
  );
  beforeEach(() => {
    jest.resetAllMocks();
    manager.find.mockResolvedValue([job]);
  });
  it('deletes only the employee-owned key, then acknowledges completion', async () => {
    await service.drain();
    expect(storage.delete).toHaveBeenCalledWith(
      `uploads/employees/${job.employeeId}.webp`,
    );
    expect(manager.delete).toHaveBeenCalledWith(EmployeeStorageCleanup, {
      employeeId: job.employeeId,
    });
    expect(storage.delete.mock.invocationCallOrder[0]).toBeLessThan(
      manager.delete.mock.invocationCallOrder[0],
    );
  });
  it('retains a failed job and retries it on the next pass', async () => {
    storage.delete.mockRejectedValueOnce(new Error('storage unavailable'));
    await service.drain();
    expect(manager.delete).not.toHaveBeenCalled();
    await service.drain();
    expect(storage.delete).toHaveBeenCalledTimes(2);
    expect(manager.delete).toHaveBeenCalledTimes(1);
  });
});
