import { Gender } from '@/database/enums/gender.enum';
import { PreferredLanguage } from '@/database/enums/preferredLanguage.enum';
import { IBase } from '@/database/interfaces/base.interface';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { IOrganization } from '@/organizations/interfaces/organization.interface';
import { Role } from '@/roles/entities/role.entity';

export interface IUser extends IBase {
  salutation?: string;
  title?: string;
  firstName: string;
  middleName?: string;
  displayName?: string;
  lastName: string;
  birthDate: Date;
  gender: Gender;
  preferredLanguage: PreferredLanguage;
  email: string;
  emailVerified: boolean;
  password: string;
  refreshToken?: string;
  mobilePhoneNumber?: string;
  profileImageUrl?: string;
  roleIds?: string[];
  roles?: Role[];
  organizationIds: string[];
  organizations: IOrganization[];

  employees?: Employee[];
}
