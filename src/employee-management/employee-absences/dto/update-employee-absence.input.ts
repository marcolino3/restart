import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreateEmployeeAbsenceNoticeInput } from './create-employee-absence-notice.input';

@InputType()
export class UpdateEmployeeAbsenceInput extends PartialType(
  CreateEmployeeAbsenceNoticeInput,
) {
  @Field(() => Int)
  id: number;
}
