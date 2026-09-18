import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EntityManager } from 'typeorm';
import { StorageService } from '@/storage/storage.service';
import { EmployeeStorageCleanup } from './entities/employee-storage-cleanup.entity';

@Injectable()
export class EmployeeStorageCleanupService {
  private readonly logger = new Logger(EmployeeStorageCleanupService.name);
  constructor(
    private readonly manager: EntityManager,
    private readonly storage: StorageService,
  ) {}

  @Cron('*/1 * * * *')
  async drain(): Promise<void> {
    const pending = await this.manager.find(EmployeeStorageCleanup, {
      take: 100,
    });
    for (const job of pending) {
      try {
        // Derived from the immutable employee UUID, never from an input URL.
        // Object deletion is idempotent, including after a worker crash.
        await this.storage.delete(`uploads/employees/${job.employeeId}.webp`);
        await this.manager.delete(EmployeeStorageCleanup, {
          employeeId: job.employeeId,
        });
      } catch {
        this.logger.warn(
          `Photo cleanup will retry for employee ${job.employeeId}`,
        );
      }
    }
  }
}
