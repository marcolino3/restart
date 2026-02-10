// src/users/dto/update-user-password.input.ts
import { Field, ID, InputType } from '@nestjs/graphql';
import { IsUUID, MinLength } from 'class-validator';

@InputType()
export class UpdateUserPasswordInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;

  @Field(() => String)
  @MinLength(8)
  newPassword!: string;
}
