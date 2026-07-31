import { IBase } from '@/database/interfaces/base.interface';
import { SchoolClassTeacherRole } from '@/database/enums/school-class-teacher-role.enum';

export interface ISchoolClassTeacher extends IBase {
  schoolClassId: string;
  employeeId: string;
  role: SchoolClassTeacherRole;
  workloadPercent?: number | null;
  validFrom: string;
  validTo?: string | null;
  organizationId: string;
}
