import { InputType, Field, ID, Int } from '@nestjs/graphql';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

@InputType()
export class CreateEmployeeAbsenceNoticeInput {
  @Field(() => String)
  @IsDateString()
  startDate: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  endDate: string;

  @Field(() => ID)
  @IsUUID('4')
  absenceCategoryId: string;

  @Field(() => String)
  @IsString()
  note: string;

  @Field(() => Boolean)
  @IsBoolean()
  isTeamInformed: boolean;

  // Mirror the absence onto the organization calendar. Default: true.
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  syncToCalendar?: boolean;

  // Calendar event title template ({firstName} {lastName} {category}).
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  calendarTitle?: string;

  // Optional: ueberschreibt den Kategorie-Default (z.B. trotz Krankheit ferienfaehig)
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isVacationCapable?: boolean;

  // Abwesenheitsgrad 1–100 (Teilabsenz, z.B. 50% AU). Default: Kategorie-Default.
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  percentage?: number;
}
