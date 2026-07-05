import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

@InputType()
export class AddTaskNoteInput {
  @Field(() => ID)
  @IsUUID()
  taskId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text: string;
}
