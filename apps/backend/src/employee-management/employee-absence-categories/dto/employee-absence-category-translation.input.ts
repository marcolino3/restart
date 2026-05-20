import { Field, InputType } from '@nestjs/graphql';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Locale } from '@/database/enums/locale.enum';

@InputType()
export class EmployeeAbsenceCategoryTranslationInput {
  @Field(() => Locale)
  @IsEnum(Locale)
  locale: Locale;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
