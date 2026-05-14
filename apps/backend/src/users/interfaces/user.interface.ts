import { IBase } from '@/database/interfaces/base.interface';

export interface IUser extends IBase {
  title?: string;
  firstName: string;
  lastName: string;
  username?: string;
  dateOfBirth?: Date;
  socialSecurityNumber?: string;
  isSuperAdmin: boolean;
}
