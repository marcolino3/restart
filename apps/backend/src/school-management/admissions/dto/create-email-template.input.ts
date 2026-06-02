import { Field, InputType } from '@nestjs/graphql';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EmailTemplateCategory } from '../enums/email-template-category.enum';

@InputType()
export class CreateEmailTemplateInput {
  @Field(() => String)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @Field(() => EmailTemplateCategory, { nullable: true })
  @IsOptional()
  @IsEnum(EmailTemplateCategory)
  category?: EmailTemplateCategory;

  @Field(() => String)
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  subject: string;

  @Field(() => String)
  @IsString()
  @MaxLength(100_000)
  bodyHtml: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
