import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { CurriculumNodeType } from '../enums/curriculum-node-type.enum';
import { CurriculumNodeTranslationInput } from './curriculum-node-translation.input';

@InputType()
export class CreateCurriculumNodeInput {
  @Field(() => ID)
  @IsUUID()
  curriculumId: string;

  @Field(() => ID)
  @IsUUID()
  levelId: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @Field(() => CurriculumNodeType)
  @IsEnum(CurriculumNodeType)
  nodeType: CurriculumNodeType;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @Field(() => [CurriculumNodeTranslationInput])
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CurriculumNodeTranslationInput)
  translations: CurriculumNodeTranslationInput[];
}
