import { registerEnumType } from '@nestjs/graphql';

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
}

registerEnumType(ProjectStatus, {
  name: 'ProjectStatus',
  description: 'Lifecycle status of a project (board)',
});
