import { IBase } from '@/database/interfaces/base.interface';
import { LessonRecordConcentration } from '../../enums/lesson-record-concentration.enum';
import { LessonRecordDifficulty } from '../../enums/lesson-record-difficulty.enum';
import { LessonRecordEngagement } from '../../enums/lesson-record-engagement.enum';
import { LessonRecordPersistence } from '../../enums/lesson-record-persistence.enum';
import { LessonRecordSelfAssessment } from '../../enums/lesson-record-self-assessment.enum';
import { LessonRecordSelfConfidence } from '../../enums/lesson-record-self-confidence.enum';
import { LessonRecordSocialForm } from '../../enums/lesson-record-social-form.enum';
import { LessonRecordStatus } from '../../enums/lesson-record-status.enum';
import { RoomMood } from '../../enums/room-mood.enum';
import { TeacherPreparation } from '../../enums/teacher-preparation.enum';
import { TeacherStressLevel } from '../../enums/teacher-stress-level.enum';

export interface ILessonRecord extends IBase {
  studentId: string;
  lessonId: string;
  recordedAt: string;
  status: LessonRecordStatus;
  note?: string | null;
  recordedById?: string | null;
  schoolClassEnrollmentId?: string | null;
  organizationId: string;
  engagement?: LessonRecordEngagement | null;
  difficulty?: LessonRecordDifficulty | null;
  socialForm?: LessonRecordSocialForm | null;
  selfAssessment?: LessonRecordSelfAssessment | null;
  selfAssessmentByChild: boolean;
  lessonClarityConfirmed?: boolean | null;
  teacherPreparation?: TeacherPreparation | null;
  roomMood?: RoomMood | null;
  teacherStressLevel?: TeacherStressLevel | null;
  selfConfidence?: LessonRecordSelfConfidence | null;
  persistence?: LessonRecordPersistence | null;
  concentration?: LessonRecordConcentration | null;
}
