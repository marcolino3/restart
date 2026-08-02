import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { LessonRecordStatus } from '../../enums/lesson-record-status.enum';

@ObjectType()
export class RecentLessonRecordStudentOutput {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  firstName: string;

  @Field(() => String)
  lastName: string;
}

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

  @Field(() => [RecentLessonRecordStudentOutput])
  students: RecentLessonRecordStudentOutput[];

  /** IDs of the underlying `lesson_records` rows in this group — used to edit the whole group at once. */
  @Field(() => [ID])
  recordIds: string[];

  /** Status shared by the whole group — a bulk entry always writes one status. */
  @Field(() => LessonRecordStatus)
  status: LessonRecordStatus;

  /** Only set when every row in the group recorded the same duration. */
  @Field(() => Int, { nullable: true })
  durationMinutes: number | null;

  @Field(() => String)
  recordedAt: string;
}
