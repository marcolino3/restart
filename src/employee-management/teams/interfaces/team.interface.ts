import { IBase } from '@/database/interfaces/base.interface';
import { IOrganization } from '@/organizations/interfaces/organization.interface';

export interface ITeam extends IBase {
  name: string;
  organizationId: string;
  organization?: IOrganization | null;
}
