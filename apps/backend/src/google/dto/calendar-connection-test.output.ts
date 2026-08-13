import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CalendarConnectionTestOutput {
  @Field(() => Boolean)
  ok: boolean;

  /** Display name of the reached calendar — only set when `ok` is true. */
  @Field(() => String, { nullable: true })
  calendarSummary?: string | null;

  /**
   * Failure reason. `CALENDAR_NOT_CONFIGURED` when the org has no credentials
   * stored; otherwise the provider's message.
   */
  @Field(() => String, { nullable: true })
  error?: string | null;
}
