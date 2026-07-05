import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsDate,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConsentStatus } from '../enums/consent-status.enum';
import { ConsentSubjectType } from '../enums/consent-subject-type.enum';

/**
 * Records (or overwrites) the current decision for one purpose × subject.
 * Only GRANTED / DENIED are accepted here — withdrawal is a separate mutation
 * so the transition is explicit and provable.
 */
@InputType()
export class RecordConsentInput {
  @Field(() => ConsentSubjectType)
  @IsEnum(ConsentSubjectType)
  subjectType: ConsentSubjectType;

  @Field(() => ID)
  @IsUUID()
  subjectId: string;

  @Field(() => ID)
  @IsUUID()
  purposeId: string;

  @Field(() => ConsentStatus)
  @IsEnum(ConsentStatus)
  @IsIn([ConsentStatus.GRANTED, ConsentStatus.DENIED], {
    message: 'status must be GRANTED or DENIED (use withdrawConsent to revoke)',
  })
  status: ConsentStatus;

  /** Required for STUDENT subjects: the guardian granting on the child's behalf. */
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  grantedByContactPersonId?: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  decidedAt?: Date;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  evidenceUrl?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
