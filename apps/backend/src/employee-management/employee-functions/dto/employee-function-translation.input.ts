import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsString, MaxLength } from 'class-validator';
import { Locale } from '@/database/enums/locale.enum';

@InputType()
export class EmployeeFunctionTranslationInput {
  @Field(() => Locale)
  @IsEnum(Locale)
  locale: Locale;

  /** Empty string clears a locale on update; service enforces at least one non-empty name. */
  @Field(() => String)
  @IsString()
  @MaxLength(200)
  name: string;
}
