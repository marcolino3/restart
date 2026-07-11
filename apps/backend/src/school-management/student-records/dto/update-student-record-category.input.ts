import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateStudentRecordCategoryInput } from './create-student-record-category.input';

@InputType()
export class UpdateStudentRecordCategoryInput extends PartialType(
  CreateStudentRecordCategoryInput,
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
