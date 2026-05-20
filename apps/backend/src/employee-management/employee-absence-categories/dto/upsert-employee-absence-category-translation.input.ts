import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Locale } from '@/database/enums/locale.enum';

@InputType()
export class UpsertEmployeeAbsenceCategoryTranslationInput {
  @Field(() => ID)
  @IsUUID()
  categoryId: string;

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
