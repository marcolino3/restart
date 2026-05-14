import { IBase } from '@/database/interfaces/base.interface';

export interface ISchoolClassEnrollment extends IBase {
  studentId: string;
  schoolClassId: string;
  enrolledAt: string;
  leftAt?: string | null;
  organizationId: string;
}
