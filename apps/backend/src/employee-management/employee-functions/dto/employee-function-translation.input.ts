import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Locale } from '@/database/enums/locale.enum';

@InputType()
export class EmployeeFunctionTranslationInput {
  @Field(() => Locale)
  @IsEnum(Locale)
  locale: Locale;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;
}
