import { Field, ID, InputType } from '@nestjs/graphql';
import { ArrayNotEmpty, IsArray, IsEnum, IsUUID } from 'class-validator';
import { TaskStatus } from '../entities/task-status.enum';

@InputType()
export class MoveTaskInput {
  @Field(() => ID)
  @IsUUID()
  id: string;

  // Target column (status) the task is dropped into.
  @Field(() => TaskStatus)
  @IsEnum(TaskStatus)
  status: TaskStatus;

  // The ordered ids of all tasks in the target column after the drop. Their
  // sortOrder is set to the array index, so the column ends up in this order.
  @Field(() => [ID])
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  orderedTaskIds: string[];
}
