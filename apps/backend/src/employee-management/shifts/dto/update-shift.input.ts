import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateShiftInput } from './create-shift.input';

@InputType()
export class UpdateShiftInput extends PartialType(CreateShiftInput) {
  @Field(() => ID)
  @IsUUID()
  id!: string;
}
