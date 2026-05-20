export type AdmissionStageType =
  | "INITIAL"
  | "IN_PROGRESS"
  | "ACCEPTED"
  | "ENROLLED"
  | "REJECTED";

export type AdmissionApplicationStatus =
  | "ACTIVE"
  | "REJECTED"
  | "ENROLLED"
  | "ARCHIVED";

export type AdmissionApplicationSource =
  | "MANUAL"
  | "PUBLIC_FORM"
  | "OPEN_DAY"
  | "REFERRAL"
  | "OTHER";

export type Gender = "MALE" | "FEMALE" | "OTHER";

export type KanbanStage = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  position: number;
  stageType: AdmissionStageType;
  isDefault: boolean;
};

export type KanbanFamilySnippet = {
  id: string;
  name: string | null;
  contactNames: string[];
  primaryEmail: string | null;
  primaryPhone: string | null;
  childrenCount: number;
};

export type KanbanApplication = {
  id: string;
  admissionStageId: string;
  position: number;
  childFirstName: string;
  childLastName: string;
  childDateOfBirth: string | null;
  childGender: Gender | null;
  status: AdmissionApplicationStatus;
  source: AdmissionApplicationSource;
  stageEnteredAt: string;
  familyId: string;
  family: KanbanFamilySnippet;
  enrolledStudentId: string | null;
  desiredGradeLevelId: string | null;
  desiredGradeLevelName: string | null;
  desiredGradeLevelColor: string | null;
  openRemindersCount: number;
  overdueRemindersCount: number;
};
