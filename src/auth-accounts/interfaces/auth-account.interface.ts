import { IBase } from '@/database/interfaces/base.interface';
import { AuthProvider } from './auth-provider.enum';
import { IUser } from '@/users/interfaces/user.interface';

export interface AuthAccount extends IBase {
  provider: AuthProvider;
  providerId: string;
  hashedPassword?: string;
  user: IUser;
}
