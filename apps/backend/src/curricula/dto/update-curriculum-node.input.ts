import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { CurriculumNodeType } from '../enums/curriculum-node-type.enum';
import { LessonScale } from '../enums/lesson-scale.enum';
import { LessonType } from '../enums/lesson-type.enum';
import { CurriculumNodeTranslationInput } from './curriculum-node-translation.input';

@InputType()
export class UpdateCurriculumNodeInput {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  levelId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @Field(() => CurriculumNodeType, { nullable: true })
  @IsOptional()
  @IsEnum(CurriculumNodeType)
  nodeType?: CurriculumNodeType;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @Field(() => LessonType, { nullable: true })
  @IsOptional()
  @IsEnum(LessonType)
  lessonType?: LessonType | null;

  @Field(() => LessonScale, { nullable: true })
  @IsOptional()
  @IsEnum(LessonScale)
  lessonScale?: LessonScale | null;

  @Field(() => [CurriculumNodeTranslationInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurriculumNodeTranslationInput)
  translations?: CurriculumNodeTranslationInput[];
}
