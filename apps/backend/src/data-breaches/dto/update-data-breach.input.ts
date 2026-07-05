import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { CreateDataBreachInput } from './create-data-breach.input';
import { DataBreachStatus } from '../enums/data-breach-status.enum';

@InputType()
export class UpdateDataBreachInput extends PartialType(CreateDataBreachInput) {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field(() => DataBreachStatus, { nullable: true })
  @IsOptional()
  @IsEnum(DataBreachStatus)
  status?: DataBreachStatus;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  measures?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  assigneeMembershipId?: string;

  /** Mark (or unmark) the supervisory authority as notified — stamps the time. */
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  authorityNotified?: boolean;

  /** Mark (or unmark) the affected data subjects as notified. */
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  subjectsNotified?: boolean;
}
