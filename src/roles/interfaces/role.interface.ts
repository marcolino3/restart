import { IBase } from '@/database/interfaces/base.interface';
import { IMembership } from '@/memberships/interfaces/membership.interface';
import { IOrganization } from '@/organizations/interfaces/organization.interface';

export interface IRole extends IBase {
  name: string;
  organizationId: string;
  organization: IOrganization;

  memberships: IMembership[];
}
