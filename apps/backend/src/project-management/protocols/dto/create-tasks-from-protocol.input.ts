import { Field, ID, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { TaskPriority } from '@/project-management/tasks/entities/task-priority.enum';

@InputType()
export class ProtocolTaskDraftInput {
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

  @Field(() => TaskPriority, { nullable: true })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  // The "Verantwortlich" — assignees of the resulting task.
  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  assigneeMembershipIds?: string[];
}

@InputType()
export class CreateTasksFromProtocolInput {
  @Field(() => ID)
  @IsUUID()
  protocolId: string;

  @Field(() => [ProtocolTaskDraftInput])
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ProtocolTaskDraftInput)
  tasks: ProtocolTaskDraftInput[];
}
