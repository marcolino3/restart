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
export class UpdateAdmissionActivityInput {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field(() => AdmissionActivityType, { nullable: true })
  @IsOptional()
  @IsEnum(AdmissionActivityType)
  type?: AdmissionActivityType;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  body?: string | null;

  @Field(() => AdmissionActivityDirection, { nullable: true })
  @IsOptional()
  @IsEnum(AdmissionActivityDirection)
  direction?: AdmissionActivityDirection | null;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string | null;
}
