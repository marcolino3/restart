import { IBase } from '@/database/interfaces/base.interface';
import { Permission } from '../entities/permission.entity';

export interface IPermission extends IBase {
  name: string;
  description?: string;
  code: string;
  permissions: Permission[];
}
