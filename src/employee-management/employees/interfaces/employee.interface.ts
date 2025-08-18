import { IBase } from '@/database/interfaces/base.interface';
import { TeamMember } from '@/employee-management/team-members/entities/team-member.entity';
import { IUser } from '@/users/interfaces/user.interface';

export interface IEmployee extends IBase {
  timeTrackingEnabled: boolean;

  user: IUser;
  userId: string;

  teamMemberships: TeamMember[];
}
