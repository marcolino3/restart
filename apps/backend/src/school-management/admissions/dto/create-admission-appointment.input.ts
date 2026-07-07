import { Field, ID, InputType, Int } from '@nestjs/graphql';
import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

@InputType()
export class CreateAdmissionAppointmentInput {
  @Field(() => ID)
  @IsUUID()
  applicationId: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  appointmentTypeId?: string;

  @Field(() => String)
  @IsISO8601()
  scheduledAt: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsISO8601()
  endsAt?: string;

  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsUUID('all', { each: true })
  assignedToMembershipIds?: string[];

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

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  note?: string;
}
