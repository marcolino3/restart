import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateEmployeeFunctionInput } from './create-employee-function.input';

@InputType()
export class UpdateEmployeeFunctionInput extends PartialType(
  CreateEmployeeFunctionInput,
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
