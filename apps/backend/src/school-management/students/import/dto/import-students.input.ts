import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Gender } from '@/database/enums/gender.enum';
import { RelationshipType } from '../../../contact-persons/enums/relationship-type.enum';
import { Salutation } from '../../../contact-persons/enums/salutation.enum';
import { StudentImportMode } from './student-import-plan.types';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

@InputType('StudentImportAddressInput')
export class StudentImportAddressInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  street?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  houseNumber?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  countryId?: string;
}

@InputType('StudentImportFamilyInput')
export class StudentImportFamilyInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  key: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @Field(() => StudentImportAddressInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => StudentImportAddressInput)
  address?: StudentImportAddressInput;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  existingFamilyId?: string;
}

@InputType('StudentImportContactInput')
export class StudentImportContactInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  tempId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  familyKey: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  existingContactPersonId?: string;

  @Field(() => Salutation, { nullable: true })
  @IsOptional()
  @IsEnum(Salutation)
  salutation?: Salutation;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  firstName: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  lastName: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  mobile?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  occupation?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  preferredLanguages?: string[];

  @Field(() => [RelationshipType], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(RelationshipType, { each: true })
  @ArrayMaxSize(11)
  roles?: RelationshipType[];
}

@InputType('StudentImportLinkInput')
export class StudentImportLinkInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  contactTempId: string;

  @Field(() => RelationshipType)
  @IsEnum(RelationshipType)
  relationshipType: RelationshipType;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isPrimaryContact?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  hasCustody?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isPickupAuthorized?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  emergencyPriority?: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  livesWithStudent?: boolean;
}

@InputType('StudentImportStudentInput')
export class StudentImportStudentInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  tempId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  familyKey: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  existingStudentId?: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  firstName: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  lastName: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  preferredName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(ISO_DATE, { message: 'dateOfBirth must be YYYY-MM-DD' })
  dateOfBirth?: string;

  @Field(() => Gender, { nullable: true })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  placeOfBirth?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  nationalities?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  firstLanguages?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  familyLanguages?: string[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  religion?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  socialSecurityNumber?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  externalStudentId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(ISO_DATE, { message: 'enrollmentDate must be YYYY-MM-DD' })
  enrollmentDate?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  schoolClassId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  gradeLevelId?: string;

  @Field(() => [StudentImportLinkInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentImportLinkInput)
  @ArrayMaxSize(20)
  links?: StudentImportLinkInput[];
}

@InputType()
export class ImportStudentsInput {
  @Field(() => StudentImportMode)
  @IsEnum(StudentImportMode)
  mode: StudentImportMode;

  @Field(() => [StudentImportFamilyInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentImportFamilyInput)
  @ArrayMaxSize(2000)
  families: StudentImportFamilyInput[];

  @Field(() => [StudentImportContactInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentImportContactInput)
  @ArrayMaxSize(4000)
  contacts: StudentImportContactInput[];

  @Field(() => [StudentImportStudentInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentImportStudentInput)
  @ArrayMaxSize(2000)
  students: StudentImportStudentInput[];
}
