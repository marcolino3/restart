import { Persona } from '@/common/enums/persona.enum';
import { IBase } from '@/database/interfaces/base.interface';
import { IOrganization } from '@/organizations/interfaces/organization.interface';
import { IUser } from '@/users/interfaces/user.interface';

export interface IMembership extends IBase {
  organizationId: string;
  organization: IOrganization;

  persona: Persona;

  userId: string;
  user: IUser;

  userEmailId?: string;
  contactPhone?: string;

  isEmployee: boolean;
  timeTrackingEnabled: boolean;
}
