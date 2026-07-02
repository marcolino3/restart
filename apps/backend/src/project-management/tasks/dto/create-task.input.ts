import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { TaskPriority } from '../entities/task-priority.enum';
import { TaskStatus } from '../entities/task-status.enum';

@InputType()
export class CreateTaskInput {
  // Omit for a personal task (no project board); the creator becomes the owner
  // and sole assignee.
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  projectId?: string | null;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(280)
  title: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  description?: string | null;

  @Field(() => TaskStatus, { nullable: true })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @Field(() => TaskPriority, { nullable: true })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  // ISO date string (YYYY-MM-DD). Stored as a date column.
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  // Memberships assigned to this task (multi-assignee). Must belong to the
  // active organization and be members of the project.
  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  assigneeMembershipIds?: string[];
}
