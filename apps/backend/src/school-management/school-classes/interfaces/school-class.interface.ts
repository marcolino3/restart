import { IBase } from '@/database/interfaces/base.interface';
import { IGradeLevel } from '@/school-management/grade-levels/interfaces/grade-level.interface';
import { IOrganization } from '@/organizations/interfaces/organization.interface';

export interface ISchoolClass extends IBase {
  name: string;
  gradeLevels?: IGradeLevel[];
  color?: string | null;
  description?: string | null;
  sortOrder: number;
  maxCapacity?: number | null;
  room?: string | null;
  organizationId: string;
  organization?: IOrganization | null;
}
