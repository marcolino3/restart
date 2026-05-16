import { IBase } from '@/database/interfaces/base.interface';

export interface IUser extends IBase {
  title?: string;
  firstName: string;
  lastName: string;
  username?: string;
  dateOfBirth?: Date;
  socialSecurityNumber?: string;
  street?: string;
  houseNumber?: string;
  addressLine2?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  isSuperAdmin: boolean;
}
