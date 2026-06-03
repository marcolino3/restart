import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { TeamMemberRole } from '../entities/team-member-role.enum';

@InputType()
export class CreateTeamMemberInput {
  @Field(() => ID)
  @IsUUID()
  teamId: string;

  @Field(() => ID)
  @IsUUID()
  employeeId: string;

  @Field(() => TeamMemberRole, { nullable: true })
  @IsOptional()
  @IsEnum(TeamMemberRole)
  role?: TeamMemberRole;
}
