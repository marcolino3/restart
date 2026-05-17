import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { LessonRecordDifficulty } from '../../enums/lesson-record-difficulty.enum';
import { LessonRecordEngagement } from '../../enums/lesson-record-engagement.enum';
import { LessonRecordSelfAssessment } from '../../enums/lesson-record-self-assessment.enum';
import { LessonRecordSocialForm } from '../../enums/lesson-record-social-form.enum';
import { RoomMood } from '../../enums/room-mood.enum';
import { TeacherPreparation } from '../../enums/teacher-preparation.enum';
import { TeacherStressLevel } from '../../enums/teacher-stress-level.enum';

/**
 * Beobachtungs-Badges — alle Felder optional.
 * Beim Bulk seedet das gleiche Set alle Kinder; per-child Overrides
 * kommen über eine separate Update-Mutation nach dem Bulk-Create.
 *
 * Zwei Achsen-Familien:
 *  - LK-Selbstbeobachtung: teacherPreparation, roomMood, teacherStressLevel
 *  - LK-Beobachtung der Kinder: engagement, difficulty, socialForm,
 *    lessonClarityConfirmed
 * (Schüler-Selbsteinschätzung [selfAssessment, selfAssessmentByChild] aktuell
 *  im Schema vorhanden, aber UI-seitig ausgeblendet — kommt später.)
 */
@InputType()
export class LessonRecordObservationInput {
  @Field(() => LessonRecordEngagement, { nullable: true })
  @IsOptional()
  @IsEnum(LessonRecordEngagement)
  engagement?: LessonRecordEngagement | null;

  @Field(() => LessonRecordDifficulty, { nullable: true })
  @IsOptional()
  @IsEnum(LessonRecordDifficulty)
  difficulty?: LessonRecordDifficulty | null;

  @Field(() => LessonRecordSocialForm, { nullable: true })
  @IsOptional()
  @IsEnum(LessonRecordSocialForm)
  socialForm?: LessonRecordSocialForm | null;

  @Field(() => LessonRecordSelfAssessment, { nullable: true })
  @IsOptional()
  @IsEnum(LessonRecordSelfAssessment)
  selfAssessment?: LessonRecordSelfAssessment | null;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  selfAssessmentByChild?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  lessonClarityConfirmed?: boolean | null;

  @Field(() => TeacherPreparation, { nullable: true })
  @IsOptional()
  @IsEnum(TeacherPreparation)
  teacherPreparation?: TeacherPreparation | null;

  @Field(() => RoomMood, { nullable: true })
  @IsOptional()
  @IsEnum(RoomMood)
  roomMood?: RoomMood | null;

  @Field(() => TeacherStressLevel, { nullable: true })
  @IsOptional()
  @IsEnum(TeacherStressLevel)
  teacherStressLevel?: TeacherStressLevel | null;
}
