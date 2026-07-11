import { InputType, Field, ID } from '@nestjs/graphql';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Gender } from '@/database/enums/gender.enum';

@InputType()
export class CreateStudentInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @Field(() => Gender, { nullable: true })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  enrollmentDate?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  exitDate?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;

  // --- Master data extension (Scope 1) ---

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  preferredName?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  placeOfBirth?: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  firstLanguages?: string[];

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  familyLanguages?: string[];

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  religion?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  socialSecurityNumber?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  externalStudentId?: string;

  /** Nationalities as Country ids (mapped to the M:N relation in the service). */
  @Field(() => [ID], { nullable: true })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  nationalityCountryIds?: string[];

  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  admissionStageId?: string;
}
