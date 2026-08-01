import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

/**
 * One row of the "recently recorded" list: a single recording ACT, not a
 * single row of `lesson_records`. A bulk entry writes one row per child, so
 * the query groups by (lesson, recordedAt) and reports how many children were
 * covered — otherwise a bulk over 20 children would flood the list.
 */
@ObjectType()
export class RecentLessonRecordOutput {
  @Field(() => ID)
  lessonId: string;

  /** Lesson name in the requested locale, falling back to EN, then to any. */
  @Field(() => String, { nullable: true })
  lessonName: string | null;

  /** Name of the AREA ancestor of the lesson node (top of the curriculum). */
  @Field(() => String, { nullable: true })
  areaName: string | null;

  @Field(() => Int)
  studentCount: number;

  @Field(() => String)
  recordedAt: string;
}
