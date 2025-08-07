import { RestartModule } from '@/database/enums/restart-module.enum';
import { IBase } from '@/database/interfaces/base.interface';
import { IOrganization } from '@/organizations/interfaces/organization.interface';
import { IPermission } from '@/permissions/interfaces/permission.interface';

export interface IRole extends IBase {
  name?: string;
  organizationId?: string;
  organization?: IOrganization;
  permissions?: IPermission;
  modules?: RestartModule;
}
