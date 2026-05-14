import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CurriculumLocale } from '../../enums/curriculum-locale.enum';
import { CurriculumNodeType } from '../../enums/curriculum-node-type.enum';

@InputType('CurriculumImportPlanTranslationInput')
export class ImportPlanTranslationInput {
  @Field(() => CurriculumLocale)
  @IsEnum(CurriculumLocale)
  locale: CurriculumLocale;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  name: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;
}

@InputType('CurriculumImportPlanNodeInput')
export class ImportPlanNodeInput {
  @Field(() => CurriculumNodeType)
  @IsEnum(CurriculumNodeType)
  nodeType: CurriculumNodeType;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  position: number;

  @Field(() => [ImportPlanTranslationInput])
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ImportPlanTranslationInput)
  translations: ImportPlanTranslationInput[];

  @Field(() => [ImportPlanNodeInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportPlanNodeInput)
  children: ImportPlanNodeInput[];
}

@InputType('CurriculumImportPlanLevelInput')
export class ImportPlanLevelInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[a-z0-9_-]+$/, {
    message: 'slug must contain only lowercase letters, digits, - or _',
  })
  slug: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  position: number;

  @Field(() => [ImportPlanTranslationInput])
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ImportPlanTranslationInput)
  translations: ImportPlanTranslationInput[];

  @Field(() => [ImportPlanNodeInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportPlanNodeInput)
  roots: ImportPlanNodeInput[];
}

@InputType()
export class ImportCurriculumPlanInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[a-z0-9_-]+$/, {
    message: 'slug must contain only lowercase letters, digits, - or _',
  })
  curriculumSlug: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  curriculumPosition?: number;

  @Field(() => [ImportPlanTranslationInput])
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ImportPlanTranslationInput)
  curriculumTranslations: ImportPlanTranslationInput[];

  @Field(() => [ImportPlanLevelInput])
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ImportPlanLevelInput)
  levels: ImportPlanLevelInput[];
}
