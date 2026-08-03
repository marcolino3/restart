import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { EmployeeFunctionTranslationInput } from './employee-function-translation.input';

@InputType()
export class CreateEmployeeFunctionInput {
  @Field(() => [EmployeeFunctionTranslationInput])
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EmployeeFunctionTranslationInput)
  translations: EmployeeFunctionTranslationInput[];

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
