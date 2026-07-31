import { Field, Int, ObjectType } from '@nestjs/graphql';

/** Stable identifiers so the frontend can map steps to routes and labels. */
export enum SetupStepKey {
  ORGANIZATION = 'ORGANIZATION',
  GRADE_LEVELS = 'GRADE_LEVELS',
  SCHOOL_CLASSES = 'SCHOOL_CLASSES',
  EMPLOYEES = 'EMPLOYEES',
  CURRICULUM = 'CURRICULUM',
  CURRICULUM_CYCLE_LINK = 'CURRICULUM_CYCLE_LINK',
  STUDENTS = 'STUDENTS',
  EMAIL = 'EMAIL',
  TIME_TRACKING = 'TIME_TRACKING',
}

@ObjectType()
export class SetupStep {
  @Field(() => String)
  key: string;

  @Field(() => Boolean)
  done: boolean;

  /** Optional steps are reported but never block `complete`. */
  @Field(() => Boolean)
  required: boolean;

  /**
   * How many records back this step. Lets the UI say "3 Stufen" instead of a
   * bare checkmark. 0 or 1 for steps that are a yes/no question.
   */
  @Field(() => Int)
  count: number;
}

@ObjectType()
export class SetupStatus {
  /** True once every *required* step is done. */
  @Field(() => Boolean)
  complete: boolean;

  @Field(() => Int)
  requiredRemaining: number;

  @Field(() => [SetupStep])
  steps: SetupStep[];
}
