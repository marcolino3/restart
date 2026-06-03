import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AdmissionRejectedBy } from '../enums/admission-rejected-by.enum';

@InputType()
export class RejectAdmissionApplicationInput {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  rejectionReasonId?: string;

  @Field(() => AdmissionRejectedBy, { nullable: true })
  @IsOptional()
  @IsEnum(AdmissionRejectedBy)
  rejectedBy?: AdmissionRejectedBy;
}
