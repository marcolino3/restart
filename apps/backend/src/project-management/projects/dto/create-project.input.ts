import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsArray,
  IsEnum,
  IsHexColor,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ProjectStatus } from '../entities/project-status.enum';

@InputType()
export class CreateProjectInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string | null;

  @Field(() => ProjectStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsHexColor()
  color?: string | null;

  // Memberships to add as initial members (besides the creator, who is always
  // added as OWNER). All must belong to the active organization.
  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  memberMembershipIds?: string[];
}
