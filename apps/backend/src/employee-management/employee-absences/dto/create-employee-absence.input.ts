import { Field, ID, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { CreateEmployeeAbsenceNoticeInput } from './create-employee-absence-notice.input';
import { AbsenceDocumentInput } from './absence-document.input';

/** Admin/HR create on behalf of a specific employee. */
@InputType()
export class CreateEmployeeAbsenceInput extends CreateEmployeeAbsenceNoticeInput {
  @Field(() => ID)
  @IsUUID('4')
  employeeId: string;

  @Field(() => [AbsenceDocumentInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AbsenceDocumentInput)
  certificates?: AbsenceDocumentInput[] | null;

  @Field(() => [AbsenceDocumentInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AbsenceDocumentInput)
  additionalDocuments?: AbsenceDocumentInput[] | null;
}
