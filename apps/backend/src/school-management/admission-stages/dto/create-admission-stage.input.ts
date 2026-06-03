import { Field, InputType, Int } from '@nestjs/graphql';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { AdmissionStageType } from '../enums/admission-stage-type.enum';
import { ADMISSION_CARD_FIELD_KEYS } from '../admission-field-keys';

@InputType()
export class CreateAdmissionStageInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[a-z0-9_-]+$/, {
    message: 'slug must contain only lowercase letters, digits, - or _',
  })
  slug: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  color?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @Field(() => AdmissionStageType, { nullable: true })
  @IsOptional()
  @IsEnum(AdmissionStageType)
  stageType?: AdmissionStageType;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn([...ADMISSION_CARD_FIELD_KEYS], { each: true })
  cardFields?: string[];
}
