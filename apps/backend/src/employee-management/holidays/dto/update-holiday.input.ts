import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateHolidayInput } from './create-holiday.input';

@InputType()
export class UpdateHolidayInput extends PartialType(CreateHolidayInput) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
