import { Field, ID, InputType, Int } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { RelationshipType } from '../enums/relationship-type.enum';

@InputType()
export class LinkContactPersonInput {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  contactPersonId: string;

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
  emergencyPriority?: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  livesWithStudent?: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
