import { IBase } from '@/database/interfaces/base.interface';

export interface ITimeTracking extends IBase {
  organizationId: string;
  employeeId: string;
  startedAt: Date;
  endedAt?: Date;
  breakMinutes?: number;
  notes?: string;
}
