import { CreateEmployeeAbsenceCategoryInput } from './create-employee-absence-category.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateEmployeeAbsenceCategoryInput extends PartialType(
  CreateEmployeeAbsenceCategoryInput,
) {
  @Field(() => Int)
  id: number;
}
