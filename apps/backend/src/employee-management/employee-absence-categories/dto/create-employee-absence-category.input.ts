import { AbsenceEntryPrecision } from '../interfaces/absence-entry-precision.enum';
import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { EmployeeAbsenceCategoryTranslationInput } from './employee-absence-category-translation.input';

@InputType()
export class CreateEmployeeAbsenceCategoryInput {
  @Field(() => [EmployeeAbsenceCategoryTranslationInput])
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EmployeeAbsenceCategoryTranslationInput)
  translations: EmployeeAbsenceCategoryTranslationInput[];

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  countsAsWorkTime?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  affectsVacationBalance?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  defaultIsVacationCapable?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  reducesVacationEntitlementAfterDays?: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  requiresCertificate?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  certificateRequiredFromDay?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxDaysPerYear?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  defaultPercentage?: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  allowsDateRange?: boolean;

  @Field(() => AbsenceEntryPrecision, { nullable: true })
  @IsOptional()
  @IsEnum(AbsenceEntryPrecision)
  entryPrecision?: AbsenceEntryPrecision;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  syncToCalendar?: boolean;

  // Calendar event title template ({firstName} {lastName} {category}).
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  calendarTitleTemplate?: string | null;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxDaysPerRequest?: number | null;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxDaysAhead?: number | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'color must be a hex value like #RRGGBB',
  })
  color?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  iconName?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
