import { Field, InputType } from '@nestjs/graphql';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CurriculumLocale } from '../enums/curriculum-locale.enum';

@InputType()
export class CurriculumTranslationInput {
  @Field(() => CurriculumLocale)
  @IsEnum(CurriculumLocale)
  locale: CurriculumLocale;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
