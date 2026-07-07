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

/** Org-configurable intake channel (Eingangskanal) an application came in through. */
export type AdmissionSource = {
  id: string;
  name: string;
  color: string | null;
  isArchived: boolean;
  position: number;
};

/** Minimal intake-channel shape as embedded on an application. */
export type AdmissionSourceRef = {
  id: string;
  name: string;
  color: string | null;
};

export type Gender = "MALE" | "FEMALE" | "OTHER";

/** Party that initiated a rejection. */
export type AdmissionRejectedBy = "SCHOOL" | "PARENTS" | "OTHER";

/** A rejected application row for the rejections list page. */
export type RejectedApplication = {
  id: string;
  childFirstName: string;
  childLastName: string;
  familyName: string | null;
  assignedGradeLevelName: string | null;
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

/** Org-configurable appointment type (Termin-Art). */
export type AdmissionAppointmentType = {
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
  admissionSource: AdmissionSourceRef | null;
  stageEnteredAt: string;
  familyId: string;
  family: KanbanFamilySnippet;
  enrolledStudentId: string | null;
  assignedGradeLevelId: string | null;
  assignedGradeLevelName: string | null;
  assignedGradeLevelColor: string | null;
  /**
   * Grade level assigned by the school, split into the Stufe (top level) and an
   * optional Untergruppe. The assigned node may be either a top-level Stufe
   * (then `untergruppe` is null) or a subgroup (then `stufe` is its parent).
   * Rendered as separate badges on the card.
   */
  assignedStufe: GradeLevelBadge | null;
  assignedUntergruppe: GradeLevelBadge | null;
  openRemindersCount: number;
  overdueRemindersCount: number;
};

/** Minimal grade-level shape for a card badge (Stufe or Untergruppe). */
export type GradeLevelBadge = {
  id: string;
  name: string;
  shortCode: string | null;
  color: string | null;
};
