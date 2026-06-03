import { IBase } from '@/database/interfaces/base.interface';
import { Gender } from '@/database/enums/gender.enum';
import { AdmissionApplicationSource } from '../enums/admission-application-source.enum';
import { AdmissionApplicationStatus } from '../enums/admission-application-status.enum';

export interface IAdmissionApplication extends IBase {
  organizationId: string;
  familyId: string;
  admissionStageId: string;
  childFirstName: string;
  childLastName: string;
  childDateOfBirth?: string | null;
  childGender?: Gender | null;
  childNotes?: string | null;
  desiredGradeLevelId?: string | null;
  desiredSchoolClassId?: string | null;
  desiredEnrollmentDate?: string | null;
  status: AdmissionApplicationStatus;
  source: AdmissionApplicationSource;
  enrolledStudentId?: string | null;
  stageEnteredAt: Date;
  position: number;
  rejectionReason?: string | null;
  rejectionReasonId?: string | null;
  rejectedBy?: string | null;
}
