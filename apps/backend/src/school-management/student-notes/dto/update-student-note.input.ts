import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateStudentNoteInput } from './create-student-note.input';

@InputType()
export class UpdateStudentNoteInput extends PartialType(
  CreateStudentNoteInput,
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
