import { registerEnumType } from '@nestjs/graphql';

export enum ProjectMemberRole {
  // Manages members and project settings, and may edit tasks.
  OWNER = 'OWNER',
  // May edit tasks within the project.
  MEMBER = 'MEMBER',
}

registerEnumType(ProjectMemberRole, {
  name: 'ProjectMemberRole',
  description: 'Role of a membership within a project (OWNER or MEMBER)',
});
