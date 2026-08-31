import { Field, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

@InputType()
export class CreateContractTemplateInput {
  @Field(() => String)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @Field(() => String)
  @IsString()
  @MaxLength(200_000)
  bodyHtml: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20_000)
  headerHtml?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20_000)
  footerHtml?: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  showLogo?: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
