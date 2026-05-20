import { Gender } from '@/database/enums/gender.enum';
import { CreateContactPersonInput } from '@/school-management/contact-persons/dto/create-contact-person.input';
import { Field, ID, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { AdmissionApplicationSource } from '../enums/admission-application-source.enum';

@InputType()
export class CreateAdmissionApplicationInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  familyId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  familyName?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  admissionStageId?: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  childFirstName: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  childLastName: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsISO8601()
  childDateOfBirth?: string;

  @Field(() => Gender, { nullable: true })
  @IsOptional()
  @IsEnum(Gender)
  childGender?: Gender;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  childNotes?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  desiredGradeLevelId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  desiredSchoolClassId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsISO8601()
  desiredEnrollmentDate?: string;

  @Field(() => AdmissionApplicationSource, { nullable: true })
  @IsOptional()
  @IsEnum(AdmissionApplicationSource)
  source?: AdmissionApplicationSource;

  @Field(() => [CreateContactPersonInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => CreateContactPersonInput)
  contactPersons?: CreateContactPersonInput[];
}
