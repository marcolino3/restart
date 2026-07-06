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

/** Party that initiated a rejection. */
export type AdmissionRejectedBy = "SCHOOL" | "PARENTS" | "OTHER";

/** A rejected application row for the rejections list page. */
export type RejectedApplication = {
  id: string;
  childFirstName: string;
  childLastName: string;
  familyName: string | null;
  desiredGradeLevelName: string | null;
  rejectionReason: string | null;
  rejectionReasonLabel: string | null;
  rejectionReasonColor: string | null;
  rejectedBy: AdmissionRejectedBy | null;
  followUpYear: string | null;
  rejectedAt: string;
};

export type KanbanStage = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  position: number;
  stageType: AdmissionStageType;
  isDefault: boolean;
  /** Per-stage card field selection; `null` ⇒ default set. */
  cardFields: string[] | null;
};

/** Org-global admissions board settings (table column selection). */
export type AdmissionBoardSettings = {
  tableColumns: string[] | null;
};

/** Org-configurable rejection reason (Absagegrund). */
export type AdmissionRejectionReason = {
  id: string;
  label: string;
  color: string | null;
  position: number;
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
