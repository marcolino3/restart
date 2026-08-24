import { AbsenceDayPart } from '../entities/absence-day-part.enum';
import { InputType, Field, ID, Int } from '@nestjs/graphql';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
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

  // Halbtag (nur Kategorien mit entryPrecision HALF_DAY, eintaegig).
  @Field(() => AbsenceDayPart, { nullable: true })
  @IsOptional()
  @IsEnum(AbsenceDayPart)
  dayPart?: AbsenceDayPart;

  // Von/Bis 'HH:mm' (Pflicht bei entryPrecision TIME, sonst verboten).
  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime?: string;
}
