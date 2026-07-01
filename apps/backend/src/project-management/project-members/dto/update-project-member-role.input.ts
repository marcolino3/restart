import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEnum, IsUUID } from 'class-validator';
import { ProjectMemberRole } from '../entities/project-member-role.enum';

@InputType()
export class UpdateProjectMemberRoleInput {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field(() => ProjectMemberRole)
  @IsEnum(ProjectMemberRole)
  role: ProjectMemberRole;
}
