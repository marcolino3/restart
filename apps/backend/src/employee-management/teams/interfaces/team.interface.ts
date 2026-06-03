import { IBase } from '@/database/interfaces/base.interface';
import { IOrganization } from '@/organizations/interfaces/organization.interface';

export interface ITeam extends IBase {
  name: string;
  sortOrder: number;
  organizationId: string;
  organization?: IOrganization | null;
  parentId?: string | null;
}
