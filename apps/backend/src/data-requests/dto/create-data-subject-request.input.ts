import { Field, ID, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { DataSubjectRequestType } from '../enums/data-subject-request-type.enum';
import { DataSubjectType } from '../enums/data-subject-type.enum';

@InputType()
export class CreateDataSubjectRequestInput {
  @Field(() => DataSubjectRequestType)
  @IsEnum(DataSubjectRequestType)
  type: DataSubjectRequestType;

  @Field(() => DataSubjectType, { nullable: true })
  @IsOptional()
  @IsEnum(DataSubjectType)
  subjectType?: DataSubjectType;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subjectName: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  contactEmail?: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  receivedAt?: Date;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
