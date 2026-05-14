import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CurriculumLocale } from '../enums/curriculum-locale.enum';

@InputType()
export class CurriculumLevelTranslationInput {
  @Field(() => CurriculumLocale)
  @IsEnum(CurriculumLocale)
  locale: CurriculumLocale;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;
}
