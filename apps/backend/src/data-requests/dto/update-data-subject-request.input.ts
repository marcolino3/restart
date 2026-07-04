import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { CreateDataSubjectRequestInput } from './create-data-subject-request.input';
import { DataSubjectRequestStatus } from '../enums/data-subject-request-status.enum';

@InputType()
export class UpdateDataSubjectRequestInput extends PartialType(
  CreateDataSubjectRequestInput,
) {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field(() => DataSubjectRequestStatus, { nullable: true })
  @IsOptional()
  @IsEnum(DataSubjectRequestStatus)
  status?: DataSubjectRequestStatus;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  assigneeMembershipId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolutionNote?: string;
}
