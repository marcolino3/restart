import { Gender } from '@/database/enums/gender.enum';
import { AdmissionApplicationSource } from '../enums/admission-application-source.enum';
import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

@InputType()
export class UpdateAdmissionApplicationInput {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  childFirstName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  childLastName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsISO8601()
  childDateOfBirth?: string | null;

  @Field(() => Gender, { nullable: true })
  @IsOptional()
  @IsEnum(Gender)
  childGender?: Gender | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  childNotes?: string | null;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  assignedGradeLevelId?: string | null;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  desiredSchoolClassId?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsISO8601()
  desiredEnrollmentDate?: string | null;

  @Field(() => AdmissionApplicationSource, { nullable: true })
  @IsOptional()
  @IsEnum(AdmissionApplicationSource)
  source?: AdmissionApplicationSource;
}
