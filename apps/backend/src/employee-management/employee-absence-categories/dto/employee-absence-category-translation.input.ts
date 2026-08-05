import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Locale } from '@/database/enums/locale.enum';

@InputType()
export class EmployeeAbsenceCategoryTranslationInput {
  @Field(() => Locale)
  @IsEnum(Locale)
  locale: Locale;

  /** Empty string clears a locale on update; service enforces at least one non-empty name. */
  @Field(() => String)
  @IsString()
  @MaxLength(120)
  name: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
