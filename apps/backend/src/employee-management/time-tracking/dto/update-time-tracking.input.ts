import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateTimeTrackingInput } from './create-time-tracking.input';

@InputType()
export class UpdateTimeTrackingInput extends PartialType(
  CreateTimeTrackingInput,
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
