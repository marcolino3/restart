import { IBase } from '@/database/interfaces/base.interface';
import { ITeam } from '@/employee-management/teams/interfaces/team.interface';
import { Membership } from '@/memberships/entities/membership.entity';
import { Role } from '@/roles/entities/role.entity';

export interface IOrganization extends IBase {
  name?: string;
  slug?: string;
  domain?: string;
  street?: string;
  zip?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  timezone: string;
  memberships?: Membership[];
  roles?: Role[];
  teams?: ITeam[];
}
