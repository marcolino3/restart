import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CurriculumTranslationInput } from './curriculum-translation.input';

@InputType()
export class CreateCurriculumInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[a-z0-9_-]+$/, {
    message: 'slug must contain only lowercase letters, digits, - or _',
  })
  slug: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @Field(() => [CurriculumTranslationInput])
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CurriculumTranslationInput)
  translations: CurriculumTranslationInput[];
}
