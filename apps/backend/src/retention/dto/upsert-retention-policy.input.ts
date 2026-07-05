import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { RetentionAction } from '../enums/retention-action.enum';
import { RetentionEntityType } from '../enums/retention-entity-type.enum';

/**
 * Upsert (one policy per org × entityType). Presence of the entityType is the
 * key — the service creates or updates the org's policy for that type.
 */
@InputType()
export class UpsertRetentionPolicyInput {
  @Field(() => RetentionEntityType)
  @IsEnum(RetentionEntityType)
  entityType: RetentionEntityType;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(1200)
  retentionMonths: number;

  @Field(() => RetentionAction, { nullable: true })
  @IsOptional()
  @IsEnum(RetentionAction)
  action?: RetentionAction;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
