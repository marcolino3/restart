// src/users/dto/create-user.input.ts
import { Field, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
} from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field(() => String)
  @IsNotEmpty()
  firstName!: string;

  @Field(() => String)
  @IsNotEmpty()
  lastName!: string;

  @Field(() => String)
  @IsEmail()
  email!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  // optional: z. B. min 3, max 60, nur sichtbare Zeichen pruefen
  // @Length(3, 60)
  username?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MinLength(8)
  password?: string;

  @Field(() => Boolean, { defaultValue: true })
  @IsBoolean()
  isActive: boolean;
}
