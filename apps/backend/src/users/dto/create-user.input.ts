import { Persona } from '@/common/enums/persona.enum';
import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MinLength,
} from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  title?: string;

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
  username?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MinLength(8)
  password?: string;

  @Field(() => Boolean, { defaultValue: true })
  @IsBoolean()
  isActive: boolean;

  @Field(() => ID)
  @IsUUID()
  organizationId!: string;

  @Field(() => Persona)
  @IsEnum(Persona)
  persona!: Persona;

  @Field(() => [ID])
  @IsUUID('4', { each: true })
  roleIds!: string[];
}
