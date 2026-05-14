import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { CurriculumLocale } from '../enums/curriculum-locale.enum';

@InputType()
export class UpsertCurriculumLevelTranslationInput {
  @Field(() => ID)
  @IsUUID()
  curriculumLevelId: string;

  @Field(() => CurriculumLocale)
  @IsEnum(CurriculumLocale)
  locale: CurriculumLocale;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;
}
