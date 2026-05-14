import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateEmployeeContractInput } from './create-employee-contract.input';

@InputType()
export class UpdateEmployeeContractInput extends PartialType(
  CreateEmployeeContractInput,
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
