import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  BloodType,
  EmergencyContactRelationship,
} from '../entities/employee-emergency-profile.entity';

@InputType()
export class UpsertEmployeeEmergencyProfileInput {
  @Field(() => ID)
  @IsUUID()
  employeeId: string;

  // --- Notfallkontakt 1 ---
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  contact1Name?: string;

  @Field(() => EmergencyContactRelationship, { nullable: true })
  @IsOptional()
  @IsEnum(EmergencyContactRelationship)
  contact1Relationship?: EmergencyContactRelationship;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  contact1Phone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  contact1Email?: string;

  // --- Notfallkontakt 2 ---
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  contact2Name?: string;

  @Field(() => EmergencyContactRelationship, { nullable: true })
  @IsOptional()
  @IsEnum(EmergencyContactRelationship)
  contact2Relationship?: EmergencyContactRelationship;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  contact2Phone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  contact2Email?: string;

  // --- Gesundheit ---
  @Field(() => BloodType, { nullable: true })
  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  allergies?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  chronicConditions?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  emergencyMedications?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  primaryDoctorName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  primaryDoctorPhone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  pharmacyName?: string;
}
