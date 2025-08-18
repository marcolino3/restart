// src/users/dto/update-user.input.ts
import { Field, ID, InputType, OmitType, PartialType } from '@nestjs/graphql';
import { IsEmail, IsOptional, IsUUID, Length } from 'class-validator';
import { CreateUserInput } from './create-user.input';

@InputType()
export class UpdateUserInput extends PartialType(
  OmitType(CreateUserInput, ['password'] as const), // kein Passwort im generischen Update
) {
  @Field(() => ID)
  @IsUUID()
  id!: string;

  // Falls du Email/Username hier strenger validieren willst, kannst du es ueberschreiben:
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Length(3, 60)
  username?: string | null;
}
