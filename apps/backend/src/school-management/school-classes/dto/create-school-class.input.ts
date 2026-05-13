import { InputType, Field, Int, ID } from '@nestjs/graphql';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';

@InputType()
export class CreateSchoolClassInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field(() => [ID], { nullable: true })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  gradeLevelIds?: string[];

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color must be a hex color (e.g. #FF5733)' })
  color?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  sortOrder?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  @Min(1)
  maxCapacity?: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  room?: string;
}
