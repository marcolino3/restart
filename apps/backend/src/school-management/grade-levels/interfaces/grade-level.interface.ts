import { IBase } from '@/database/interfaces/base.interface';
import { IOrganization } from '@/organizations/interfaces/organization.interface';

export interface IGradeLevel extends IBase {
  name: string;
  color?: string | null;
  sortOrder: number;
  organizationId: string;
  organization?: IOrganization | null;
}
