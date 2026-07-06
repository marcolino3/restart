import { IBase } from '@/database/interfaces/base.interface';
import { IOrganization } from '@/organizations/interfaces/organization.interface';

export interface IGradeLevel extends IBase {
  name: string;
  parentId?: string | null;
  parent?: IGradeLevel | null;
  children?: IGradeLevel[];
  color?: string | null;
  shortCode?: string | null;
  ageMin?: number | null;
  ageMax?: number | null;
  sortOrder: number;
  organizationId: string;
  organization?: IOrganization | null;
}
