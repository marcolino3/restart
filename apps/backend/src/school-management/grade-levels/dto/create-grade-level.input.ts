import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

@InputType()
export class CreateGradeLevelInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  color?: string;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  sortOrder?: number;
}
