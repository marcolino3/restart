import { IBase } from '@/database/interfaces/base.interface';

export interface IUser extends IBase {
  firstName: string;
  lastName: string;
  email?: string | null;
  username?: string | null;
  passwordHash?: string | null;
  goolgeId?: string | null;
}
