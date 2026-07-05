import { Field, ID, InputType, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsUUID } from 'class-validator';

/** When the first-login invitation is dispatched after finalizing. */
export enum InvitationTiming {
  /** Send immediately when the employee is finalized. */
  IMMEDIATE = 'IMMEDIATE',
  /** Queue for the contract start date (nightly cron dispatches it). */
  ON_ENTRY_DATE = 'ON_ENTRY_DATE',
  /** Do not send yet — the admin triggers it manually later. */
  MANUAL = 'MANUAL',
}

registerEnumType(InvitationTiming, { name: 'InvitationTiming' });

@InputType()
export class FinalizeEmployeeOnboardingInput {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field(() => InvitationTiming)
  @IsEnum(InvitationTiming)
  invitationTiming: InvitationTiming;
}
