import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateProcessingActivityInput } from './create-processing-activity.input';

@InputType()
export class UpdateProcessingActivityInput extends PartialType(
  CreateProcessingActivityInput,
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
