import { IBase } from '@/database/interfaces/base.interface';

export interface IEmployeeContract extends IBase {
  organizationId: string;
  employeeId: string;
  startDate: Date;
  endDate?: Date;
  workloadPercent?: number;
  grossSalary?: number;
  notes?: string;
}
