import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsHexColor,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

@InputType()
export class CreateExpenseCategoryInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsHexColor()
  @MaxLength(16)
  color?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
