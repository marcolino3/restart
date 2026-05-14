import { IBase } from '@/database/interfaces/base.interface';
import { AuthProvider } from './auth-provider.enum';
import { IUserEmail } from '@/user-emails/interfaces/user-email.interface';

export interface IAuthAccount extends IBase {
  provider: AuthProvider;
  providerId: string;
  userEmail: IUserEmail;
}
