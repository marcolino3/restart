import { Field, ID, InputType, Int } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { RelationshipType } from '../enums/relationship-type.enum';

@InputType()
export class UpdateStudentContactPersonInput {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field(() => RelationshipType, { nullable: true })
  @IsOptional()
  @IsEnum(RelationshipType)
  relationshipType?: RelationshipType;

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
