import { InputType, Field, ID, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateEmployeeAbsenceNoticeInput } from './create-employee-absence-notice.input';

@InputType()
export class UpdateEmployeeAbsenceInput extends PartialType(
  CreateEmployeeAbsenceNoticeInput,
) {
  @Field(() => ID)
  @IsUUID('4')
  id: string;
}
