import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TaskPriority } from '@/project-management/tasks/entities/task-priority.enum';
import { SystemRole } from '@/roles/entities/system-role.enum';

@InputType()
export class TemplateTaskInput {
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

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  dueOffsetDays?: number | null;

  @Field(() => SystemRole, { nullable: true })
  @IsOptional()
  @IsEnum(SystemRole)
  defaultAssigneeRole?: SystemRole | null;
}
