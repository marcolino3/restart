import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateEmployeeAbsenceCategoryInput } from './create-employee-absence-category.input';

@InputType()
export class UpdateEmployeeAbsenceCategoryInput extends PartialType(
  CreateEmployeeAbsenceCategoryInput,
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
