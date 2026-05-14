import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsEmail, IsOptional } from 'class-validator';

@InputType()
export class CreateUserEmailInput {
  @Field(() => String)
  @IsEmail()
  email!: string;

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
