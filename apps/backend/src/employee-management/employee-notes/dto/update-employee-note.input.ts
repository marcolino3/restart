import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateEmployeeNoteInput } from './create-employee-note.input';

@InputType()
export class UpdateEmployeeNoteInput extends PartialType(
  CreateEmployeeNoteInput,
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
