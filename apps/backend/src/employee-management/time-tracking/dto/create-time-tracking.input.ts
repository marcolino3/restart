import { Field, ID, InputType, Int } from '@nestjs/graphql';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

@InputType()
export class CreateTimeTrackingInput {
  @Field(() => ID)
  @IsUUID()
  employeeId: string;

  @Field(() => String)
  @IsDateString()
  startedAt: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  endedAt?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  breakMinutes?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}
