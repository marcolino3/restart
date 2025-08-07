import { registerEnumType } from '@nestjs/graphql';
export enum TeamRole {
  MEMBER = 'MEMBER',
  LEADER = 'LEADER',
}

registerEnumType(TeamRole, {
  name: 'TeamRole',
  description: 'Supported Team Roles',
});
