import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { TemplateTaskInput } from './template-task.input';

@InputType()
export class CreateProjectTemplateInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string | null;

  @Field(() => [TemplateTaskInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateTaskInput)
  tasks?: TemplateTaskInput[];
}
