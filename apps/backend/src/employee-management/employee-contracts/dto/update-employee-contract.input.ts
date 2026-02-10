import { CreateEmployeeContractInput } from './create-employee-contract.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateEmployeeContractInput extends PartialType(CreateEmployeeContractInput) {
  @Field(() => Int)
  id: number;
}
