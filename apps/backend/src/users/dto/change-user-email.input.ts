import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEmail, IsUUID } from 'class-validator';

@InputType()
export class ChangeUserEmailInput {
  @Field(() => ID)
  @IsUUID()
  userId: string;

  @Field(() => String)
  @IsEmail()
  newEmail: string;
}
