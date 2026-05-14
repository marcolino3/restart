import { InputType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

@InputType()
export class CreateGradeLevelInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  sortOrder?: number;
}
