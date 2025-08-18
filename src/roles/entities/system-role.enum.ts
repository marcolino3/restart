import { registerEnumType } from '@nestjs/graphql';

export enum SystemRole {
  ORG_OWNER = 'ORG_OWNER',
  ORG_ADMIN = 'ORG_ADMIN',
  HR_MANAGER = 'HR_MANAGER',
  OFFICE = 'OFFICE',
  TEAM_LEAD = 'TEAM_LEAD',
  EMPLOYEE = 'EMPLOYEE',
}

registerEnumType(SystemRole, {
  name: 'SystemRole',
  description: 'Supported System Roles',
});
