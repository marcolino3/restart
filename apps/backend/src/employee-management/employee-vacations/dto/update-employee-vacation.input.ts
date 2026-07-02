import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateEmployeeVacationInput } from './create-employee-vacation.input';

@InputType()
export class UpdateEmployeeVacationInput extends PartialType(
  CreateEmployeeVacationInput,
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
