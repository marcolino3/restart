import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ProjectMemberRole } from '../entities/project-member-role.enum';

@InputType()
export class AddProjectMemberInput {
  @Field(() => ID)
  @IsUUID()
  projectId: string;

  @Field(() => ID)
  @IsUUID()
  membershipId: string;

  @Field(() => ProjectMemberRole, { nullable: true })
  @IsOptional()
  @IsEnum(ProjectMemberRole)
  role?: ProjectMemberRole;
}
