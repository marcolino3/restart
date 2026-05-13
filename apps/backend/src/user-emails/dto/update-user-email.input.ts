import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateUserEmailInput } from './create-user-email.input';

@InputType()
export class UpdateUserEmailInput extends PartialType(CreateUserEmailInput) {
  @Field(() => ID)
  @IsUUID()
  id!: string;
}
