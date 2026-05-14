import { IBase } from '@/database/interfaces/base.interface';

export interface IUserEmail extends IBase {
  userId: string;
  email: string;
  isPrimary: boolean;
  isVerified: boolean;
}
