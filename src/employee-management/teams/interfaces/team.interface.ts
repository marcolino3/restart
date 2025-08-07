import { IBase } from '@/database/interfaces/base.interface';
import { IOrganization } from '@/organizations/interfaces/organization.interface';
import { TeamMembership } from '../entities/team-membership.entity';

export interface ITeam extends IBase {
  name?: string;
  parentTeam?: ITeam;
  parentTeamId?: string;
  organization?: IOrganization;
  organizationId?: string;
  members: TeamMembership[];
}
