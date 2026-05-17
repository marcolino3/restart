import { IBase } from '@/database/interfaces/base.interface';
import { LessonRecordStatus } from '../../enums/lesson-record-status.enum';

export interface ILessonRecord extends IBase {
  studentId: string;
  lessonId: string;
  recordedAt: string;
  status: LessonRecordStatus;
  note?: string | null;
  recordedById?: string | null;
  schoolClassEnrollmentId?: string | null;
  organizationId: string;
}
