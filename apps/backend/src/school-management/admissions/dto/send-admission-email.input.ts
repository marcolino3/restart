import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

@InputType()
export class SendAdmissionEmailInput {
  @Field(() => ID)
  @IsUUID()
  applicationId: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @Field(() => String)
  @IsEmail()
  @MaxLength(320)
  toEmail: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  toName?: string;

  @Field(() => String)
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  subject: string;

  @Field(() => String)
  @IsString()
  @MinLength(1)
  @MaxLength(100_000)
  bodyHtml: string;
}
