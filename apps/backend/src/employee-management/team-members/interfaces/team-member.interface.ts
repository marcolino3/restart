import { IBase } from '@/database/interfaces/base.interface';

export interface ITeamMember extends IBase {
  organizationId: string;
  teamId: string;
  employeeId: string;
}
