import { Field, ID, InputType, Int } from '@nestjs/graphql';
import {
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { AdmissionActivityDirection } from '../enums/admission-activity-direction.enum';
import { AdmissionActivityType } from '../enums/admission-activity-type.enum';

@InputType()
export class CreateAdmissionActivityInput {
  @Field(() => ID)
  @IsUUID()
  applicationId: string;

  @Field(() => AdmissionActivityType)
  @IsEnum(AdmissionActivityType)
  type: AdmissionActivityType;

  @Field(() => String)
  @IsISO8601()
  occurredAt: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  body?: string;

  @Field(() => AdmissionActivityDirection, { nullable: true })
  @IsOptional()
  @IsEnum(AdmissionActivityDirection)
  direction?: AdmissionActivityDirection;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;
}
