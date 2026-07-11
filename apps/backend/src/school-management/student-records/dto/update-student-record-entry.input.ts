import { Field, ID, InputType, OmitType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateStudentRecordEntryInput } from './create-student-record-entry.input';

/**
 * `studentId` is immutable after creation — an entry cannot be moved to another
 * student — so it is omitted from the update input.
 */
@InputType()
export class UpdateStudentRecordEntryInput extends PartialType(
  OmitType(CreateStudentRecordEntryInput, ['studentId'] as const),
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
