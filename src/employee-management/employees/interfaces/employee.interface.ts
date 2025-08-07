import { IBase } from '@/database/interfaces/base.interface';
import { TeamMembership } from '@/employee-management/teams/entities/team-membership.entity';
import { IUser } from '@/users/interfaces/user.interface';

export interface IEmployee extends IBase {
  timeTrackingEnabled: boolean;

  user: IUser;
  userId: string;

  teamMemberships: TeamMembership[];
}
