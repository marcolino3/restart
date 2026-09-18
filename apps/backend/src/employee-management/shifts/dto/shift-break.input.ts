import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Matches } from 'class-validator';

export const TIME_HH_MM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Unpaid break inside a shift, wall-clock `HH:MM`. */
@ObjectType('ShiftBreak')
export class ShiftBreak {
  @Field(() => String)
  startTime!: string;

  @Field(() => String)
  endTime!: string;
}

@InputType()
export class ShiftBreakInput {
  @Field(() => String)
  @Matches(TIME_HH_MM_RE, { message: 'break startTime must be HH:MM' })
  startTime!: string;

  @Field(() => String)
  @Matches(TIME_HH_MM_RE, { message: 'break endTime must be HH:MM' })
  endTime!: string;
}
