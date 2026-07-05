import { Field, InputType, Int } from '@nestjs/graphql';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { ConsentLegalBasis } from '../enums/consent-legal-basis.enum';
import { ConsentSubjectType } from '../enums/consent-subject-type.enum';

@InputType()
export class CreateConsentPurposeInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
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
  @MaxLength(1000)
  description?: string;

  @Field(() => [ConsentSubjectType])
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(ConsentSubjectType, { each: true })
  appliesTo: ConsentSubjectType[];

  @Field(() => ConsentLegalBasis, { nullable: true })
  @IsOptional()
  @IsEnum(ConsentLegalBasis)
  legalBasis?: ConsentLegalBasis;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  requiresEvidence?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
