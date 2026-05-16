import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';
import {
  CountryInputFieldType,
  CountryInputValidatorKind,
} from '../entities/country-input-template.entity';

@InputType()
export class UpsertCountryInputTemplateInput {
  /** ISO-2 country code (CH, DE, …) oder '*' für globales Template. */
  @Field(() => String)
  @IsString()
  @Length(1, 2)
  @Matches(/^(\*|[A-Z]{2})$/, {
    message: 'countryCode must be ISO-2 uppercase or "*"',
  })
  countryCode: string;

  @Field(() => CountryInputFieldType)
  @IsEnum(CountryInputFieldType)
  fieldType: CountryInputFieldType;

  @Field(() => String)
  @IsString()
  @Length(1, 100)
  mask: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  placeholder?: string | null;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxLength?: number | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  regex?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Length(0, 20)
  prefix?: string | null;

  @Field(() => CountryInputValidatorKind, {
    nullable: true,
    defaultValue: CountryInputValidatorKind.NONE,
  })
  @IsOptional()
  @IsEnum(CountryInputValidatorKind)
  validatorKind?: CountryInputValidatorKind;
}
