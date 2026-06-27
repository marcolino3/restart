import { Field, ID, InputType, OmitType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateTaskInput } from './create-task.input';

@InputType()
export class UpdateTaskInput extends PartialType(
  // A task cannot be moved to another project via update.
  OmitType(CreateTaskInput, ['projectId'] as const),
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
