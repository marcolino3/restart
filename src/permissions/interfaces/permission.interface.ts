import { RestartModule } from '@/database/enums/restart-module.enum';
import { IBase } from '@/database/interfaces/base.interface';

export interface IPermission extends IBase {
  name?: string;
  description?: string;
  module: RestartModule;
  code: string;
}
