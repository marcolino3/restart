/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: any; output: any; }
};

export type AbsenceCategorySummary = {
  __typename?: 'AbsenceCategorySummary';
  categoryId: Scalars['ID']['output'];
  color?: Maybe<Scalars['String']['output']>;
  fullDays: Scalars['Int']['output'];
  name?: Maybe<Scalars['String']['output']>;
  partialDays: Scalars['Int']['output'];
  totalDays: Scalars['Int']['output'];
};

export type AccessReviewEntry = {
  __typename?: 'AccessReviewEntry';
  lastReviewedAt?: Maybe<Scalars['DateTime']['output']>;
  memberName: Scalars['String']['output'];
  membershipId: Scalars['ID']['output'];
  roles: Array<Scalars['String']['output']>;
  sensitivePermissions: Array<Scalars['String']['output']>;
};

export type AccessibleTeam = {
  __typename?: 'AccessibleTeam';
  effectiveRole: TeamMemberRole;
  team: Team;
};

export type AddProjectMemberInput = {
  membershipId: Scalars['ID']['input'];
  projectId: Scalars['ID']['input'];
  role?: InputMaybe<ProjectMemberRole>;
};

export type AddTaskNoteInput = {
  taskId: Scalars['ID']['input'];
  text: Scalars['String']['input'];
};

export type Address = {
  __typename?: 'Address';
  addressLine2?: Maybe<Scalars['String']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Country>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  houseNumber?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  postalCode?: Maybe<Scalars['String']['output']>;
  state?: Maybe<Scalars['String']['output']>;
  street?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type AddressSuggestion = {
  __typename?: 'AddressSuggestion';
  address: Address;
  contactPersonName: Scalars['String']['output'];
  relationshipType: Scalars['String']['output'];
  studentName: Scalars['String']['output'];
};

export type AdmissionActivity = {
  __typename?: 'AdmissionActivity';
  application?: Maybe<AdmissionApplication>;
  applicationId: Scalars['ID']['output'];
  body?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdByMembership?: Maybe<Membership>;
  createdByMembershipId?: Maybe<Scalars['ID']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  direction?: Maybe<AdmissionActivityDirection>;
  durationMinutes?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  location?: Maybe<Scalars['String']['output']>;
  occurredAt: Scalars['DateTime']['output'];
  organizationId: Scalars['String']['output'];
  subject?: Maybe<Scalars['String']['output']>;
  type: AdmissionActivityType;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export enum AdmissionActivityDirection {
  Inbound = 'INBOUND',
  Outbound = 'OUTBOUND'
}

export enum AdmissionActivityType {
  Call = 'CALL',
  Email = 'EMAIL',
  Meeting = 'MEETING',
  Note = 'NOTE'
}

export type AdmissionApplication = {
  __typename?: 'AdmissionApplication';
  admissionSource?: Maybe<AdmissionSource>;
  admissionSourceId?: Maybe<Scalars['ID']['output']>;
  admissionStage?: Maybe<AdmissionStage>;
  admissionStageId: Scalars['ID']['output'];
  assignedGradeLevel?: Maybe<GradeLevel>;
  assignedGradeLevelId?: Maybe<Scalars['ID']['output']>;
  childDateOfBirth?: Maybe<Scalars['String']['output']>;
  childFirstName: Scalars['String']['output'];
  childGender?: Maybe<Gender>;
  childLastName: Scalars['String']['output'];
  childNotes?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  desiredEnrollmentDate?: Maybe<Scalars['String']['output']>;
  desiredSchoolClass?: Maybe<SchoolClass>;
  desiredSchoolClassId?: Maybe<Scalars['ID']['output']>;
  enrolledStudent?: Maybe<Student>;
  enrolledStudentId?: Maybe<Scalars['ID']['output']>;
  family?: Maybe<Family>;
  familyId: Scalars['ID']['output'];
  followUpYear?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  position: Scalars['Int']['output'];
  rejectedBy?: Maybe<AdmissionRejectedBy>;
  rejectionReason?: Maybe<Scalars['String']['output']>;
  rejectionReasonId?: Maybe<Scalars['ID']['output']>;
  rejectionReasonRef?: Maybe<AdmissionRejectionReason>;
  stageEnteredAt: Scalars['DateTime']['output'];
  status: AdmissionApplicationStatus;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

/** Lifecycle status of an admission application — independent of the configurable stage. */
export enum AdmissionApplicationStatus {
  Active = 'ACTIVE',
  Archived = 'ARCHIVED',
  Enrolled = 'ENROLLED',
  Rejected = 'REJECTED'
}

export type AdmissionAppointment = {
  __typename?: 'AdmissionAppointment';
  activity?: Maybe<AdmissionActivity>;
  activityId?: Maybe<Scalars['ID']['output']>;
  application?: Maybe<AdmissionApplication>;
  applicationId: Scalars['ID']['output'];
  appointmentType?: Maybe<AdmissionAppointmentType>;
  appointmentTypeId?: Maybe<Scalars['ID']['output']>;
  assignees?: Maybe<Array<AdmissionAppointmentAssignee>>;
  createdAt: Scalars['DateTime']['output'];
  createdByMembership?: Maybe<Membership>;
  createdByMembershipId?: Maybe<Scalars['ID']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  durationMinutes?: Maybe<Scalars['Int']['output']>;
  endsAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  location?: Maybe<Scalars['String']['output']>;
  note?: Maybe<Scalars['String']['output']>;
  organizationId: Scalars['String']['output'];
  scheduledAt: Scalars['DateTime']['output'];
  status: AdmissionAppointmentStatus;
  title?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type AdmissionAppointmentAssignee = {
  __typename?: 'AdmissionAppointmentAssignee';
  appointmentId: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  membership?: Maybe<Membership>;
  membershipId: Scalars['ID']['output'];
  organizationId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

/** Lifecycle status of an admission appointment. */
export enum AdmissionAppointmentStatus {
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Rescheduling = 'RESCHEDULING',
  Scheduled = 'SCHEDULED'
}

export type AdmissionAppointmentType = {
  __typename?: 'AdmissionAppointmentType';
  color?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  position: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export enum AdmissionAuditAction {
  Archived = 'ARCHIVED',
  ContactAdded = 'CONTACT_ADDED',
  ContactRemoved = 'CONTACT_REMOVED',
  Created = 'CREATED',
  Enrolled = 'ENROLLED',
  FieldUpdated = 'FIELD_UPDATED',
  FormSubmitted = 'FORM_SUBMITTED',
  NoteAdded = 'NOTE_ADDED',
  Rejected = 'REJECTED',
  Restored = 'RESTORED',
  StageChanged = 'STAGE_CHANGED'
}

export type AdmissionAuditLog = {
  __typename?: 'AdmissionAuditLog';
  action: AdmissionAuditAction;
  actorMembership?: Maybe<Membership>;
  actorMembershipId?: Maybe<Scalars['ID']['output']>;
  application?: Maybe<AdmissionApplication>;
  applicationId: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  fieldName?: Maybe<Scalars['String']['output']>;
  fromStage?: Maybe<AdmissionStage>;
  fromStageId?: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  metadata?: Maybe<Scalars['String']['output']>;
  newValue?: Maybe<Scalars['String']['output']>;
  oldValue?: Maybe<Scalars['String']['output']>;
  organizationId: Scalars['String']['output'];
  toStage?: Maybe<AdmissionStage>;
  toStageId?: Maybe<Scalars['ID']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type AdmissionBoardSettings = {
  __typename?: 'AdmissionBoardSettings';
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  tableColumns?: Maybe<Array<Scalars['String']['output']>>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type AdmissionDocument = {
  __typename?: 'AdmissionDocument';
  application?: Maybe<AdmissionApplication>;
  applicationId: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  fileId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  mimeType: Scalars['String']['output'];
  organizationId: Scalars['String']['output'];
  originalName: Scalars['String']['output'];
  sizeBytes: Scalars['Int']['output'];
  tags: Array<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  uploadedByMembership?: Maybe<Membership>;
  uploadedByMembershipId?: Maybe<Scalars['ID']['output']>;
  version: Scalars['Int']['output'];
};

export type AdmissionEmail = {
  __typename?: 'AdmissionEmail';
  application?: Maybe<AdmissionApplication>;
  applicationId: Scalars['ID']['output'];
  bodyHtml: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  errorMessage?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  organizationId: Scalars['String']['output'];
  providerMessageId?: Maybe<Scalars['String']['output']>;
  sentAt: Scalars['DateTime']['output'];
  sentByMembership?: Maybe<Membership>;
  sentByMembershipId?: Maybe<Scalars['ID']['output']>;
  status: AdmissionEmailStatus;
  subject: Scalars['String']['output'];
  template?: Maybe<EmailTemplate>;
  templateId?: Maybe<Scalars['ID']['output']>;
  toEmail: Scalars['String']['output'];
  toName?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type AdmissionEmailPreview = {
  __typename?: 'AdmissionEmailPreview';
  availableVariables: Array<Scalars['String']['output']>;
  bodyHtml: Scalars['String']['output'];
  subject: Scalars['String']['output'];
  toEmail?: Maybe<Scalars['String']['output']>;
  toName?: Maybe<Scalars['String']['output']>;
};

export enum AdmissionEmailStatus {
  Failed = 'FAILED',
  Sent = 'SENT'
}

/** Party that initiated the rejection of an admission application (school, parents, or other). */
export enum AdmissionRejectedBy {
  Other = 'OTHER',
  Parents = 'PARENTS',
  School = 'SCHOOL'
}

export type AdmissionRejectionReason = {
  __typename?: 'AdmissionRejectionReason';
  color?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  position: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type AdmissionReminder = {
  __typename?: 'AdmissionReminder';
  application?: Maybe<AdmissionApplication>;
  applicationId: Scalars['ID']['output'];
  assignedToMembership?: Maybe<Membership>;
  assignedToMembershipId?: Maybe<Scalars['ID']['output']>;
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  completedByMembership?: Maybe<Membership>;
  completedByMembershipId?: Maybe<Scalars['ID']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdByMembership?: Maybe<Membership>;
  createdByMembershipId?: Maybe<Scalars['ID']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  dueAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  note?: Maybe<Scalars['String']['output']>;
  organizationId: Scalars['String']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export enum AdmissionReminderFilter {
  Completed = 'COMPLETED',
  Open = 'OPEN',
  Overdue = 'OVERDUE',
  Today = 'TODAY',
  Week = 'WEEK'
}

export type AdmissionSource = {
  __typename?: 'AdmissionSource';
  color?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  position: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type AdmissionStage = {
  __typename?: 'AdmissionStage';
  cardFields?: Maybe<Array<Scalars['String']['output']>>;
  color?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  isDefault: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  position: Scalars['Int']['output'];
  slug: Scalars['String']['output'];
  stageType: AdmissionStageType;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

/** Lifecycle category of an admission stage — drives generic logic independent of stage names */
export enum AdmissionStageType {
  Accepted = 'ACCEPTED',
  Enrolled = 'ENROLLED',
  Initial = 'INITIAL',
  InProgress = 'IN_PROGRESS',
  Rejected = 'REJECTED'
}

/** Purpose of an agenda item (Entscheidung / Information / Diskussion) */
export enum AgendaGoal {
  Decision = 'DECISION',
  Discussion = 'DISCUSSION',
  Information = 'INFORMATION'
}

export type AgendaItem = {
  __typename?: 'AgendaItem';
  goal?: Maybe<AgendaGoal>;
  no?: Maybe<Scalars['Int']['output']>;
  topic: Scalars['String']['output'];
};

export type AgendaItemInput = {
  goal?: InputMaybe<AgendaGoal>;
  no?: InputMaybe<Scalars['Int']['input']>;
  topic: Scalars['String']['input'];
};

export type AreaLessonCount = {
  __typename?: 'AreaLessonCount';
  areaId: Scalars['ID']['output'];
  curriculumId?: Maybe<Scalars['ID']['output']>;
  curriculumName?: Maybe<Scalars['String']['output']>;
  lessonCount: Scalars['Int']['output'];
};

export type AttentionAncestor = {
  __typename?: 'AttentionAncestor';
  id: Scalars['String']['output'];
  nodeType: Scalars['String']['output'];
  translations: Array<AttentionAncestorTranslation>;
};

export type AttentionAncestorTranslation = {
  __typename?: 'AttentionAncestorTranslation';
  locale: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type AttentionItemOutput = {
  __typename?: 'AttentionItemOutput';
  ancestors: Array<AttentionAncestor>;
  days?: Maybe<Scalars['Int']['output']>;
  lessonId: Scalars['String']['output'];
  lessonName: Scalars['String']['output'];
  reason: AttentionReason;
  severity: Scalars['Int']['output'];
  since?: Maybe<Scalars['String']['output']>;
};

export enum AttentionReason {
  BigGapIntroToPracticed = 'BIG_GAP_INTRO_TO_PRACTICED',
  NeedsMoreCurrent = 'NEEDS_MORE_CURRENT',
  RepeatedNeedsMore = 'REPEATED_NEEDS_MORE',
  StuckIntroduced = 'STUCK_INTRODUCED',
  StuckPracticed = 'STUCK_PRACTICED'
}

export type AttentionReasonCounts = {
  __typename?: 'AttentionReasonCounts';
  BIG_GAP_INTRO_TO_PRACTICED: Scalars['Int']['output'];
  NEEDS_MORE_CURRENT: Scalars['Int']['output'];
  REPEATED_NEEDS_MORE: Scalars['Int']['output'];
  STUCK_INTRODUCED: Scalars['Int']['output'];
  STUCK_PRACTICED: Scalars['Int']['output'];
};

export type AuthAccount = {
  __typename?: 'AuthAccount';
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  provider: AuthProvider;
  providerId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  userEmail: UserEmail;
  userEmailId: Scalars['ID']['output'];
  version: Scalars['Int']['output'];
};

export type AuthContextOutput = {
  __typename?: 'AuthContextOutput';
  isProjectMember: Scalars['Boolean']['output'];
  isSuperAdmin: Scalars['Boolean']['output'];
  orgId?: Maybe<Scalars['String']['output']>;
  orgName?: Maybe<Scalars['String']['output']>;
  permissions: Array<Scalars['String']['output']>;
  persona?: Maybe<Persona>;
  roles: Array<Scalars['String']['output']>;
  theme?: Maybe<Scalars['String']['output']>;
  timeTrackingEnabled: Scalars['Boolean']['output'];
  user: User;
};

/** The supported auth providers. */
export enum AuthProvider {
  Apple = 'APPLE',
  Google = 'GOOGLE'
}

export enum BloodType {
  AbNeg = 'AB_NEG',
  AbPos = 'AB_POS',
  ANeg = 'A_NEG',
  APos = 'A_POS',
  BNeg = 'B_NEG',
  BPos = 'B_POS',
  ONeg = 'O_NEG',
  OPos = 'O_POS'
}

export type ChangeUserEmailInput = {
  newEmail: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};

export type ClassroomHeatmapDataOutput = {
  __typename?: 'ClassroomHeatmapDataOutput';
  areas: Array<HeatmapAreaOutput>;
  cells: Array<HeatmapCellOutput>;
  students: Array<HeatmapStudentOutput>;
};

export type CompanyVacation = {
  __typename?: 'CompanyVacation';
  appliesToAll: Scalars['Boolean']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  endDate: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  organizationId: Scalars['ID']['output'];
  startDate: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type Consent = {
  __typename?: 'Consent';
  actorMembership?: Maybe<Membership>;
  actorMembershipId?: Maybe<Scalars['ID']['output']>;
  createdAt: Scalars['DateTime']['output'];
  decidedAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  evidenceUrl?: Maybe<Scalars['String']['output']>;
  grantedByContactPerson?: Maybe<ContactPerson>;
  grantedByContactPersonId?: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  note?: Maybe<Scalars['String']['output']>;
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  purpose?: Maybe<ConsentPurpose>;
  purposeId: Scalars['ID']['output'];
  status: ConsentStatus;
  subjectId: Scalars['ID']['output'];
  subjectType: ConsentSubjectType;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
  withdrawnAt?: Maybe<Scalars['DateTime']['output']>;
};

/** Immutable history event for a consent decision change */
export enum ConsentAuditAction {
  Denied = 'DENIED',
  Granted = 'GRANTED',
  Updated = 'UPDATED',
  Withdrawn = 'WITHDRAWN'
}

export type ConsentAuditLog = {
  __typename?: 'ConsentAuditLog';
  action: ConsentAuditAction;
  actorMembership?: Maybe<Membership>;
  actorMembershipId?: Maybe<Scalars['ID']['output']>;
  consentId?: Maybe<Scalars['ID']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  newStatus?: Maybe<ConsentStatus>;
  note?: Maybe<Scalars['String']['output']>;
  organizationId: Scalars['String']['output'];
  previousStatus?: Maybe<ConsentStatus>;
  purposeId: Scalars['ID']['output'];
  subjectId: Scalars['ID']['output'];
  subjectType: ConsentSubjectType;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

/** Lawful basis for the processing (DSGVO Art. 6 / revDSG) */
export enum ConsentLegalBasis {
  Consent = 'CONSENT',
  Contract = 'CONTRACT',
  LegalObligation = 'LEGAL_OBLIGATION',
  LegitimateInterest = 'LEGITIMATE_INTEREST',
  PublicTask = 'PUBLIC_TASK',
  VitalInterest = 'VITAL_INTEREST'
}

export type ConsentPurpose = {
  __typename?: 'ConsentPurpose';
  appliesTo: Array<ConsentSubjectType>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  isMandatory: Scalars['Boolean']['output'];
  legalBasis: ConsentLegalBasis;
  name: Scalars['String']['output'];
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  position: Scalars['Int']['output'];
  requiresEvidence: Scalars['Boolean']['output'];
  slug: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

/** Current decision on a consent purpose for a subject */
export enum ConsentStatus {
  Denied = 'DENIED',
  Granted = 'GRANTED',
  Withdrawn = 'WITHDRAWN'
}

/** The kind of data subject a consent refers to */
export enum ConsentSubjectType {
  Employee = 'EMPLOYEE',
  Student = 'STUDENT'
}

export type ContactPerson = {
  __typename?: 'ContactPerson';
  address?: Maybe<Address>;
  addressId?: Maybe<Scalars['ID']['output']>;
  createdAt: Scalars['DateTime']['output'];
  dateOfBirth?: Maybe<Scalars['String']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  family?: Maybe<Family>;
  familyId?: Maybe<Scalars['ID']['output']>;
  firstName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  lastName: Scalars['String']['output'];
  middleName?: Maybe<Scalars['String']['output']>;
  mobile?: Maybe<Scalars['String']['output']>;
  nationalities: Array<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  occupation?: Maybe<Scalars['String']['output']>;
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  phone?: Maybe<Scalars['String']['output']>;
  preferredLanguages: Array<Scalars['String']['output']>;
  roles: Array<RelationshipType>;
  salutation?: Maybe<Salutation>;
  socialSecurityNumber?: Maybe<Scalars['String']['output']>;
  sortOrder: Scalars['Int']['output'];
  title?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  userId?: Maybe<Scalars['ID']['output']>;
  version: Scalars['Int']['output'];
};

export type Country = {
  __typename?: 'Country';
  createdAt: Scalars['DateTime']['output'];
  currency?: Maybe<Scalars['String']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  isoCode?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export enum CountryInputFieldType {
  Iban = 'IBAN',
  Phone = 'PHONE',
  PostalCode = 'POSTAL_CODE',
  Ssn = 'SSN'
}

export type CountryInputTemplate = {
  __typename?: 'CountryInputTemplate';
  countryCode: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  fieldType: CountryInputFieldType;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  mask: Scalars['String']['output'];
  maxLength?: Maybe<Scalars['Int']['output']>;
  placeholder?: Maybe<Scalars['String']['output']>;
  prefix?: Maybe<Scalars['String']['output']>;
  regex?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  validatorKind: CountryInputValidatorKind;
  version: Scalars['Int']['output'];
};

export enum CountryInputValidatorKind {
  ChSsn = 'CH_SSN',
  IbanMod97 = 'IBAN_MOD97',
  None = 'NONE',
  Regex = 'REGEX'
}

export type CreateAddressInput = {
  addressLine2?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  countryId?: InputMaybe<Scalars['ID']['input']>;
  houseNumber?: InputMaybe<Scalars['String']['input']>;
  postalCode?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
  street?: InputMaybe<Scalars['String']['input']>;
};

export type CreateAdmissionActivityInput = {
  applicationId: Scalars['ID']['input'];
  body?: InputMaybe<Scalars['String']['input']>;
  direction?: InputMaybe<AdmissionActivityDirection>;
  durationMinutes?: InputMaybe<Scalars['Int']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  occurredAt: Scalars['String']['input'];
  subject?: InputMaybe<Scalars['String']['input']>;
  type: AdmissionActivityType;
};

export type CreateAdmissionApplicationInput = {
  admissionSourceId?: InputMaybe<Scalars['ID']['input']>;
  admissionStageId?: InputMaybe<Scalars['ID']['input']>;
  assignedGradeLevelId?: InputMaybe<Scalars['ID']['input']>;
  childDateOfBirth?: InputMaybe<Scalars['String']['input']>;
  childFirstName: Scalars['String']['input'];
  childGender?: InputMaybe<Gender>;
  childLastName: Scalars['String']['input'];
  childNotes?: InputMaybe<Scalars['String']['input']>;
  contactPersons?: InputMaybe<Array<CreateContactPersonInput>>;
  desiredEnrollmentDate?: InputMaybe<Scalars['String']['input']>;
  desiredSchoolClassId?: InputMaybe<Scalars['ID']['input']>;
  familyId?: InputMaybe<Scalars['ID']['input']>;
  familyName?: InputMaybe<Scalars['String']['input']>;
};

export type CreateAdmissionAppointmentInput = {
  applicationId: Scalars['ID']['input'];
  appointmentTypeId?: InputMaybe<Scalars['ID']['input']>;
  assignedToMembershipIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  durationMinutes?: InputMaybe<Scalars['Int']['input']>;
  endsAt?: InputMaybe<Scalars['String']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  note?: InputMaybe<Scalars['String']['input']>;
  scheduledAt: Scalars['String']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
};

export type CreateAdmissionAppointmentTypeInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  label: Scalars['String']['input'];
  position?: InputMaybe<Scalars['Int']['input']>;
};

export type CreateAdmissionRejectionReasonInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  label: Scalars['String']['input'];
  position?: InputMaybe<Scalars['Int']['input']>;
};

export type CreateAdmissionReminderInput = {
  applicationId: Scalars['ID']['input'];
  assignedToMembershipId?: InputMaybe<Scalars['ID']['input']>;
  dueAt: Scalars['String']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

export type CreateAdmissionSourceInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  position?: InputMaybe<Scalars['Int']['input']>;
};

export type CreateAdmissionStageInput = {
  cardFields?: InputMaybe<Array<Scalars['String']['input']>>;
  color?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  position?: InputMaybe<Scalars['Int']['input']>;
  slug: Scalars['String']['input'];
  stageType?: InputMaybe<AdmissionStageType>;
};

export type CreateCompanyVacationInput = {
  appliesToAll?: InputMaybe<Scalars['Boolean']['input']>;
  endDate: Scalars['String']['input'];
  name: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
};

export type CreateConsentPurposeInput = {
  appliesTo: Array<ConsentSubjectType>;
  description?: InputMaybe<Scalars['String']['input']>;
  isMandatory?: InputMaybe<Scalars['Boolean']['input']>;
  legalBasis?: InputMaybe<ConsentLegalBasis>;
  name: Scalars['String']['input'];
  position?: InputMaybe<Scalars['Int']['input']>;
  requiresEvidence?: InputMaybe<Scalars['Boolean']['input']>;
  slug: Scalars['String']['input'];
};

export type CreateContactPersonInput = {
  addressId?: InputMaybe<Scalars['ID']['input']>;
  dateOfBirth?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  familyId?: InputMaybe<Scalars['ID']['input']>;
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  links?: InputMaybe<Array<LinkContactPersonInput>>;
  middleName?: InputMaybe<Scalars['String']['input']>;
  mobile?: InputMaybe<Scalars['String']['input']>;
  nationalities?: InputMaybe<Array<Scalars['String']['input']>>;
  notes?: InputMaybe<Scalars['String']['input']>;
  occupation?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  preferredLanguages?: InputMaybe<Array<Scalars['String']['input']>>;
  roles?: InputMaybe<Array<RelationshipType>>;
  salutation?: InputMaybe<Salutation>;
  socialSecurityNumber?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type CreateCountryInput = {
  /** Example field (placeholder) */
  exampleField: Scalars['Int']['input'];
};

export type CreateCurriculumInput = {
  position?: InputMaybe<Scalars['Int']['input']>;
  slug: Scalars['String']['input'];
  translations: Array<CurriculumTranslationInput>;
};

export type CreateCurriculumLevelInput = {
  curriculumId: Scalars['ID']['input'];
  position?: InputMaybe<Scalars['Int']['input']>;
  slug: Scalars['String']['input'];
  translations: Array<CurriculumLevelTranslationInput>;
};

export type CreateCurriculumNodeInput = {
  curriculumId: Scalars['ID']['input'];
  levelId: Scalars['ID']['input'];
  nodeType: CurriculumNodeType;
  parentId?: InputMaybe<Scalars['ID']['input']>;
  position?: InputMaybe<Scalars['Int']['input']>;
  translations: Array<CurriculumNodeTranslationInput>;
};

export type CreateDataBreachInput = {
  affectedCount?: InputMaybe<Scalars['Int']['input']>;
  affectedScope?: InputMaybe<Scalars['String']['input']>;
  description: Scalars['String']['input'];
  detectedAt?: InputMaybe<Scalars['DateTime']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  riskLevel?: InputMaybe<DataBreachRiskLevel>;
  title: Scalars['String']['input'];
};

export type CreateDataSubjectRequestInput = {
  contactEmail?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  receivedAt?: InputMaybe<Scalars['DateTime']['input']>;
  subjectId?: InputMaybe<Scalars['ID']['input']>;
  subjectName: Scalars['String']['input'];
  subjectType?: InputMaybe<DataSubjectType>;
  type: DataSubjectRequestType;
};

export type CreateEmailTemplateInput = {
  bodyHtml: Scalars['String']['input'];
  category?: InputMaybe<EmailTemplateCategory>;
  description?: InputMaybe<Scalars['String']['input']>;
  isAutomatic?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  subject: Scalars['String']['input'];
};

export type CreateEmployeeAbsenceCategoryInput = {
  affectsVacationBalance?: InputMaybe<Scalars['Boolean']['input']>;
  certificateRequiredFromDay?: InputMaybe<Scalars['Int']['input']>;
  color?: InputMaybe<Scalars['String']['input']>;
  countsAsWorkTime?: InputMaybe<Scalars['Boolean']['input']>;
  defaultIsVacationCapable?: InputMaybe<Scalars['Boolean']['input']>;
  defaultPercentage?: InputMaybe<Scalars['Int']['input']>;
  iconName?: InputMaybe<Scalars['String']['input']>;
  isPaid?: InputMaybe<Scalars['Boolean']['input']>;
  maxDaysPerYear?: InputMaybe<Scalars['Int']['input']>;
  reducesVacationEntitlementAfterDays?: InputMaybe<Scalars['Int']['input']>;
  requiresApproval?: InputMaybe<Scalars['Boolean']['input']>;
  requiresCertificate?: InputMaybe<Scalars['Boolean']['input']>;
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
  translations: Array<EmployeeAbsenceCategoryTranslationInput>;
};

export type CreateEmployeeAbsenceNoticeInput = {
  absenceCategoryId: Scalars['ID']['input'];
  endDate?: InputMaybe<Scalars['String']['input']>;
  isTeamInformed: Scalars['Boolean']['input'];
  isVacationCapable?: InputMaybe<Scalars['Boolean']['input']>;
  note: Scalars['String']['input'];
  percentage?: InputMaybe<Scalars['Int']['input']>;
  startDate: Scalars['String']['input'];
};

export type CreateEmployeeContractInput = {
  annualVacationDays?: InputMaybe<Scalars['Int']['input']>;
  contractType?: InputMaybe<EmployeeContractType>;
  documentUrl?: InputMaybe<Scalars['String']['input']>;
  employeeId: Scalars['ID']['input'];
  endDate?: InputMaybe<Scalars['String']['input']>;
  grossSalary?: InputMaybe<Scalars['Float']['input']>;
  has13thSalary?: InputMaybe<Scalars['Boolean']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  paymentInterval?: InputMaybe<EmployeePaymentInterval>;
  position?: InputMaybe<Scalars['String']['input']>;
  probationEndDate?: InputMaybe<Scalars['String']['input']>;
  remainingVacationDays?: InputMaybe<Scalars['String']['input']>;
  startDate: Scalars['String']['input'];
  supervisorMembershipId?: InputMaybe<Scalars['ID']['input']>;
  weekdayTimeWindows?: InputMaybe<WeekdayTimeWindowsInput>;
  weeklyHours?: InputMaybe<Scalars['String']['input']>;
  workloadPercent?: InputMaybe<Scalars['Float']['input']>;
};

export type CreateEmployeeInput = {
  addressLine2?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  contactPhone?: InputMaybe<Scalars['String']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  dateOfBirth?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  houseNumber?: InputMaybe<Scalars['String']['input']>;
  lastName: Scalars['String']['input'];
  persona: Persona;
  postalCode?: InputMaybe<Scalars['String']['input']>;
  socialSecurityNumber?: InputMaybe<Scalars['String']['input']>;
  street?: InputMaybe<Scalars['String']['input']>;
  timeTrackingEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type CreateEmployeeNoteInput = {
  category: EmployeeNoteCategory;
  content: Scalars['String']['input'];
  date?: InputMaybe<Scalars['String']['input']>;
  employeeId: Scalars['ID']['input'];
  isConfidential?: InputMaybe<Scalars['Boolean']['input']>;
  title: Scalars['String']['input'];
};

export type CreateEmployeePaidOvertimeInput = {
  date: Scalars['String']['input'];
  employeeId: Scalars['ID']['input'];
  minutes: Scalars['Int']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
};

export type CreateEmployeeVacationInput = {
  employeeId: Scalars['ID']['input'];
  endDate: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  startDate: Scalars['String']['input'];
};

export type CreateFamilyInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  primaryAddressId?: InputMaybe<Scalars['ID']['input']>;
};

export type CreateGradeLevelInput = {
  ageMax?: InputMaybe<Scalars['Int']['input']>;
  ageMin?: InputMaybe<Scalars['Int']['input']>;
  color?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  parentId?: InputMaybe<Scalars['ID']['input']>;
  shortCode?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
};

export type CreateHolidayInput = {
  canton?: InputMaybe<Scalars['String']['input']>;
  date: Scalars['String']['input'];
  name: Scalars['String']['input'];
  paidPercentage?: InputMaybe<Scalars['Int']['input']>;
};

export type CreateLessonRecordInput = {
  lessonId: Scalars['ID']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
  observation?: InputMaybe<LessonRecordObservationInput>;
  recordedAt: Scalars['String']['input'];
  schoolClassEnrollmentId?: InputMaybe<Scalars['ID']['input']>;
  status: LessonRecordStatus;
  studentId: Scalars['ID']['input'];
};

export type CreateLessonRecordsBulkInput = {
  lessonId: Scalars['ID']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
  observation?: InputMaybe<LessonRecordObservationInput>;
  recordedAt: Scalars['String']['input'];
  status: LessonRecordStatus;
  studentIds: Array<Scalars['ID']['input']>;
};

export type CreateMembershipInput = {
  contactPhone?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['ID']['input'];
  persona: Persona;
  userEmailId?: InputMaybe<Scalars['ID']['input']>;
  userId: Scalars['ID']['input'];
};

export type CreateOrganizationSettingInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  key: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
  value: Scalars['String']['input'];
};

export type CreateProcessingActivityInput = {
  dataCategories?: InputMaybe<Scalars['String']['input']>;
  dataSubjects?: InputMaybe<Scalars['String']['input']>;
  legalBasis?: InputMaybe<ConsentLegalBasis>;
  name: Scalars['String']['input'];
  purpose?: InputMaybe<Scalars['String']['input']>;
  recipients?: InputMaybe<Scalars['String']['input']>;
  retentionNote?: InputMaybe<Scalars['String']['input']>;
};

export type CreateProjectFromTemplateInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['String']['input']>;
  memberMembershipIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  templateId: Scalars['ID']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
};

export type CreateProjectInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['String']['input']>;
  memberMembershipIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  status?: InputMaybe<ProjectStatus>;
  title: Scalars['String']['input'];
};

export type CreateProjectTemplateInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  tasks?: InputMaybe<Array<TemplateTaskInput>>;
  title: Scalars['String']['input'];
};

export type CreateProtocolInput = {
  endTime?: InputMaybe<Scalars['String']['input']>;
  externalParticipants?: InputMaybe<Array<Scalars['String']['input']>>;
  meetingDate?: InputMaybe<Scalars['String']['input']>;
  participantMembershipIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  projectId?: InputMaybe<Scalars['ID']['input']>;
  sections?: InputMaybe<ProtocolSectionsInput>;
  startTime?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<ProtocolStatus>;
  templateId?: InputMaybe<Scalars['ID']['input']>;
  title: Scalars['String']['input'];
};

export type CreateProtocolTemplateInput = {
  agendaItems?: InputMaybe<Array<AgendaItemInput>>;
  defaultParticipantMembershipIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  title: Scalars['String']['input'];
};

export type CreateSchoolClassEnrollmentInput = {
  enrolledAt: Scalars['String']['input'];
  leftAt?: InputMaybe<Scalars['String']['input']>;
  schoolClassId: Scalars['ID']['input'];
  studentId: Scalars['ID']['input'];
};

export type CreateSchoolClassInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  gradeLevelIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  maxCapacity?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  room?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
  teacherIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export type CreateStudentInput = {
  admissionStageId?: InputMaybe<Scalars['ID']['input']>;
  dateOfBirth?: InputMaybe<Scalars['String']['input']>;
  enrollmentDate?: InputMaybe<Scalars['String']['input']>;
  exitDate?: InputMaybe<Scalars['String']['input']>;
  firstName: Scalars['String']['input'];
  gender?: InputMaybe<Gender>;
  lastName: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
};

export type CreateStudentNoteInput = {
  category: StudentNoteCategory;
  content: Scalars['String']['input'];
  date?: InputMaybe<Scalars['String']['input']>;
  isConfidential?: InputMaybe<Scalars['Boolean']['input']>;
  studentId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};

export type CreateSubprocessorInput = {
  country?: InputMaybe<Scalars['String']['input']>;
  dpaSigned?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  purpose?: InputMaybe<Scalars['String']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
};

export type CreateTaskInput = {
  assigneeMembershipIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  checklist?: InputMaybe<Array<TaskChecklistItemInput>>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['String']['input']>;
  dueTime?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<TaskPriority>;
  projectId?: InputMaybe<Scalars['ID']['input']>;
  status?: InputMaybe<TaskStatus>;
  title: Scalars['String']['input'];
};

export type CreateTasksFromProtocolInput = {
  protocolId: Scalars['ID']['input'];
  tasks: Array<ProtocolTaskDraftInput>;
};

export type CreateTeamInput = {
  name: Scalars['String']['input'];
  parentId?: InputMaybe<Scalars['ID']['input']>;
};

export type CreateTeamMemberInput = {
  employeeId: Scalars['ID']['input'];
  role?: InputMaybe<TeamMemberRole>;
  teamId: Scalars['ID']['input'];
};

export type CreateTimeTrackingInput = {
  breakMinutes?: InputMaybe<Scalars['Int']['input']>;
  employeeId: Scalars['ID']['input'];
  endedAt?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  startedAt: Scalars['String']['input'];
};

export type CreateUserInput = {
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  isActive?: Scalars['Boolean']['input'];
  lastName: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
  password?: InputMaybe<Scalars['String']['input']>;
  persona: Persona;
  roleIds: Array<Scalars['ID']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};

export type Curriculum = {
  __typename?: 'Curriculum';
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  position: Scalars['Int']['output'];
  slug: Scalars['String']['output'];
  translations?: Maybe<Array<CurriculumTranslation>>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type CurriculumImportPlanLevel = {
  __typename?: 'CurriculumImportPlanLevel';
  position: Scalars['Int']['output'];
  roots: Array<CurriculumImportPlanNode>;
  slug: Scalars['String']['output'];
  translations: Array<CurriculumImportPlanTranslation>;
};

export type CurriculumImportPlanLevelInput = {
  position: Scalars['Int']['input'];
  roots: Array<CurriculumImportPlanNodeInput>;
  slug: Scalars['String']['input'];
  translations: Array<CurriculumImportPlanTranslationInput>;
};

export type CurriculumImportPlanNode = {
  __typename?: 'CurriculumImportPlanNode';
  children: Array<CurriculumImportPlanNode>;
  nodeType: CurriculumNodeType;
  position: Scalars['Int']['output'];
  sourceRowNumber?: Maybe<Scalars['Int']['output']>;
  tempId: Scalars['String']['output'];
  translations: Array<CurriculumImportPlanTranslation>;
};

export type CurriculumImportPlanNodeInput = {
  children: Array<CurriculumImportPlanNodeInput>;
  nodeType: CurriculumNodeType;
  position: Scalars['Int']['input'];
  translations: Array<CurriculumImportPlanTranslationInput>;
};

export type CurriculumImportPlanStats = {
  __typename?: 'CurriculumImportPlanStats';
  areaCount: Scalars['Int']['output'];
  groupCount: Scalars['Int']['output'];
  lessonCount: Scalars['Int']['output'];
  levelCount: Scalars['Int']['output'];
  rowCount: Scalars['Int']['output'];
  topicCount: Scalars['Int']['output'];
};

export type CurriculumImportPlanTranslation = {
  __typename?: 'CurriculumImportPlanTranslation';
  locale: CurriculumLocale;
  name: Scalars['String']['output'];
  notes?: Maybe<Scalars['String']['output']>;
};

export type CurriculumImportPlanTranslationInput = {
  locale: CurriculumLocale;
  name: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
};

export type CurriculumLevel = {
  __typename?: 'CurriculumLevel';
  createdAt: Scalars['DateTime']['output'];
  curriculum?: Maybe<Curriculum>;
  curriculumId: Scalars['ID']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  position: Scalars['Int']['output'];
  slug: Scalars['String']['output'];
  translations?: Maybe<Array<CurriculumLevelTranslation>>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type CurriculumLevelTranslation = {
  __typename?: 'CurriculumLevelTranslation';
  createdAt: Scalars['DateTime']['output'];
  curriculumLevelId: Scalars['String']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  locale: CurriculumLocale;
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type CurriculumLevelTranslationInput = {
  locale: CurriculumLocale;
  name: Scalars['String']['input'];
};

/** Supported locales for curriculum content */
export enum CurriculumLocale {
  De = 'DE',
  En = 'EN',
  Fr = 'FR',
  It = 'IT'
}

export type CurriculumNode = {
  __typename?: 'CurriculumNode';
  ancestors: Array<CurriculumNode>;
  children?: Maybe<Array<CurriculumNode>>;
  createdAt: Scalars['DateTime']['output'];
  curriculumId: Scalars['ID']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  lessonScale?: Maybe<LessonScale>;
  lessonType?: Maybe<LessonType>;
  levelId: Scalars['ID']['output'];
  nodeType: CurriculumNodeType;
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  parentId?: Maybe<Scalars['ID']['output']>;
  position: Scalars['Int']['output'];
  prerequisites?: Maybe<Array<CurriculumNode>>;
  translations?: Maybe<Array<CurriculumNodeTranslation>>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type CurriculumNodeTranslation = {
  __typename?: 'CurriculumNodeTranslation';
  createdAt: Scalars['DateTime']['output'];
  curriculumNodeId: Scalars['String']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  locale: CurriculumLocale;
  name: Scalars['String']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type CurriculumNodeTranslationInput = {
  locale: CurriculumLocale;
  name: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
};

/** Hierarchy level of a curriculum node: AREA > TOPIC > GROUP > LESSON */
export enum CurriculumNodeType {
  Area = 'AREA',
  Group = 'GROUP',
  Lesson = 'LESSON',
  Topic = 'TOPIC'
}

export type CurriculumTranslation = {
  __typename?: 'CurriculumTranslation';
  createdAt: Scalars['DateTime']['output'];
  curriculumId: Scalars['String']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  locale: CurriculumLocale;
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type CurriculumTranslationInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  locale: CurriculumLocale;
  name: Scalars['String']['input'];
};

export type DataBreachIncident = {
  __typename?: 'DataBreachIncident';
  affectedCount?: Maybe<Scalars['Int']['output']>;
  affectedScope?: Maybe<Scalars['String']['output']>;
  assigneeMembership?: Maybe<Membership>;
  assigneeMembershipId?: Maybe<Scalars['ID']['output']>;
  authorityNotificationDueAt: Scalars['DateTime']['output'];
  authorityNotifiedAt?: Maybe<Scalars['DateTime']['output']>;
  closedAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdByMembership?: Maybe<Membership>;
  createdByMembershipId?: Maybe<Scalars['ID']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description: Scalars['String']['output'];
  detectedAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  measures?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  riskLevel: DataBreachRiskLevel;
  status: DataBreachStatus;
  subjectsNotifiedAt?: Maybe<Scalars['DateTime']['output']>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

/** Risk to affected data subjects */
export enum DataBreachRiskLevel {
  High = 'HIGH',
  Low = 'LOW',
  Medium = 'MEDIUM'
}

/** Lifecycle status of a data-breach incident */
export enum DataBreachStatus {
  Closed = 'CLOSED',
  Contained = 'CONTAINED',
  Investigating = 'INVESTIGATING',
  Open = 'OPEN'
}

export type DataSubjectRequest = {
  __typename?: 'DataSubjectRequest';
  assigneeMembership?: Maybe<Membership>;
  assigneeMembershipId?: Maybe<Scalars['ID']['output']>;
  contactEmail?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdByMembership?: Maybe<Membership>;
  createdByMembershipId?: Maybe<Scalars['ID']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  dueDate: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  receivedAt: Scalars['DateTime']['output'];
  resolutionNote?: Maybe<Scalars['String']['output']>;
  resolvedAt?: Maybe<Scalars['DateTime']['output']>;
  status: DataSubjectRequestStatus;
  subjectId?: Maybe<Scalars['ID']['output']>;
  subjectName: Scalars['String']['output'];
  subjectType: DataSubjectType;
  type: DataSubjectRequestType;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

/** Lifecycle status of a data-subject request */
export enum DataSubjectRequestStatus {
  Completed = 'COMPLETED',
  InProgress = 'IN_PROGRESS',
  New = 'NEW',
  Rejected = 'REJECTED'
}

/** The data-subject right being exercised (DSGVO Art. 15–21) */
export enum DataSubjectRequestType {
  Access = 'ACCESS',
  Erasure = 'ERASURE',
  Objection = 'OBJECTION',
  Portability = 'PORTABILITY',
  Rectification = 'RECTIFICATION',
  Restriction = 'RESTRICTION'
}

/** The kind of person a data-subject request concerns */
export enum DataSubjectType {
  ContactPerson = 'CONTACT_PERSON',
  Employee = 'EMPLOYEE',
  Other = 'OTHER',
  Student = 'STUDENT'
}

export type EmailTemplate = {
  __typename?: 'EmailTemplate';
  bodyHtml: Scalars['String']['output'];
  category: EmailTemplateCategory;
  createdAt: Scalars['DateTime']['output'];
  createdByMembership?: Maybe<Membership>;
  createdByMembershipId?: Maybe<Scalars['ID']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  isAutomatic: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  organizationId: Scalars['String']['output'];
  sentCount: Scalars['Int']['output'];
  subject: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export enum EmailTemplateCategory {
  Admission = 'ADMISSION',
  General = 'GENERAL'
}

export enum EmergencyContactRelationship {
  Child = 'CHILD',
  Friend = 'FRIEND',
  Other = 'OTHER',
  Parent = 'PARENT',
  Partner = 'PARTNER',
  Sibling = 'SIBLING',
  Spouse = 'SPOUSE'
}

export type Employee = {
  __typename?: 'Employee';
  absences?: Maybe<EmployeeAbsence>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  invitationScheduledSendAt?: Maybe<Scalars['DateTime']['output']>;
  invitationStatus: EmployeeInvitationStatus;
  invitedAt?: Maybe<Scalars['DateTime']['output']>;
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  membership: Membership;
  notes?: Maybe<Array<EmployeeNote>>;
  status: EmployeeStatus;
  teamMembers?: Maybe<Array<TeamMember>>;
  timeBalanceMinutes?: Maybe<Scalars['Int']['output']>;
  timeTrackingEnabled: Scalars['Boolean']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
  workloadPercent?: Maybe<Scalars['Int']['output']>;
};

export type EmployeeAbsence = {
  __typename?: 'EmployeeAbsence';
  absenceCategoryId: Scalars['String']['output'];
  absenceDays?: Maybe<Array<EmployeeAbsenceDay>>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  employee: Employee;
  employeeId: Scalars['String']['output'];
  endDate?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  isTeamInformed: Scalars['Boolean']['output'];
  isVacationCapable: Scalars['Boolean']['output'];
  membershipId: Scalars['String']['output'];
  note: Scalars['String']['output'];
  organizationId: Scalars['String']['output'];
  percentage: Scalars['Int']['output'];
  startDate: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type EmployeeAbsenceCategory = {
  __typename?: 'EmployeeAbsenceCategory';
  affectsVacationBalance: Scalars['Boolean']['output'];
  certificateRequiredFromDay?: Maybe<Scalars['Int']['output']>;
  color?: Maybe<Scalars['String']['output']>;
  countsAsWorkTime: Scalars['Boolean']['output'];
  createdAt: Scalars['DateTime']['output'];
  defaultIsVacationCapable: Scalars['Boolean']['output'];
  defaultPercentage: Scalars['Int']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  iconName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  isPaid: Scalars['Boolean']['output'];
  isSystem: Scalars['Boolean']['output'];
  maxDaysPerYear?: Maybe<Scalars['Int']['output']>;
  organizationId: Scalars['ID']['output'];
  reducesVacationEntitlementAfterDays?: Maybe<Scalars['Int']['output']>;
  requiresApproval: Scalars['Boolean']['output'];
  requiresCertificate: Scalars['Boolean']['output'];
  sortOrder: Scalars['Int']['output'];
  systemCode?: Maybe<SystemEmployeeAbsenceCategory>;
  translations?: Maybe<Array<EmployeeAbsenceCategoryTranslation>>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type EmployeeAbsenceCategoryTranslation = {
  __typename?: 'EmployeeAbsenceCategoryTranslation';
  categoryId: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  locale: Locale;
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type EmployeeAbsenceCategoryTranslationInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  locale: Locale;
  name: Scalars['String']['input'];
};

export type EmployeeAbsenceDay = {
  __typename?: 'EmployeeAbsenceDay';
  absenceCategory?: Maybe<EmployeeAbsenceCategory>;
  absenceCategoryId?: Maybe<Scalars['ID']['output']>;
  createdAt: Scalars['DateTime']['output'];
  date: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  employee: Employee;
  employeeAbsence: EmployeeAbsence;
  employeeAbsenceId: Scalars['ID']['output'];
  employeeId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  organization: Organization;
  organizationId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type EmployeeAuditLog = {
  __typename?: 'EmployeeAuditLog';
  actorMembership?: Maybe<Membership>;
  actorMembershipId?: Maybe<Scalars['ID']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  employee: Employee;
  employeeId: Scalars['ID']['output'];
  entityType: EmployeeAuditLogEntityType;
  fieldName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  newValue?: Maybe<Scalars['String']['output']>;
  oldValue?: Maybe<Scalars['String']['output']>;
  organizationId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export enum EmployeeAuditLogEntityType {
  Employee = 'EMPLOYEE',
  Membership = 'MEMBERSHIP',
  User = 'USER'
}

export type EmployeeContract = {
  __typename?: 'EmployeeContract';
  annualVacationDays?: Maybe<Scalars['Int']['output']>;
  contractType?: Maybe<EmployeeContractType>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  documentUrl?: Maybe<Scalars['String']['output']>;
  employee?: Maybe<Employee>;
  employeeId: Scalars['String']['output'];
  endDate?: Maybe<Scalars['String']['output']>;
  grossSalary?: Maybe<Scalars['Float']['output']>;
  has13thSalary?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  paymentInterval?: Maybe<EmployeePaymentInterval>;
  position?: Maybe<Scalars['String']['output']>;
  previousContract?: Maybe<EmployeeContract>;
  previousContractId?: Maybe<Scalars['ID']['output']>;
  probationEndDate?: Maybe<Scalars['String']['output']>;
  remainingVacationDays?: Maybe<Scalars['String']['output']>;
  startDate: Scalars['String']['output'];
  supervisor?: Maybe<Membership>;
  supervisorMembershipId?: Maybe<Scalars['ID']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
  weekdayTimeWindows?: Maybe<WeekdayTimeWindows>;
  weekdayWorkloads?: Maybe<WeekdayWorkloads>;
  weeklyHours?: Maybe<Scalars['String']['output']>;
  workloadPercent?: Maybe<Scalars['Float']['output']>;
};

export enum EmployeeContractType {
  Apprenticeship = 'APPRENTICESHIP',
  Hourly = 'HOURLY',
  Internship = 'INTERNSHIP',
  Permanent = 'PERMANENT',
  Temporary = 'TEMPORARY'
}

export type EmployeeEmergencyProfile = {
  __typename?: 'EmployeeEmergencyProfile';
  allergies?: Maybe<Scalars['String']['output']>;
  bloodType?: Maybe<BloodType>;
  chronicConditions?: Maybe<Scalars['String']['output']>;
  contact1Email?: Maybe<Scalars['String']['output']>;
  contact1Name?: Maybe<Scalars['String']['output']>;
  contact1Phone?: Maybe<Scalars['String']['output']>;
  contact1Relationship?: Maybe<EmergencyContactRelationship>;
  contact2Email?: Maybe<Scalars['String']['output']>;
  contact2Name?: Maybe<Scalars['String']['output']>;
  contact2Phone?: Maybe<Scalars['String']['output']>;
  contact2Relationship?: Maybe<EmergencyContactRelationship>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  emergencyMedications?: Maybe<Scalars['String']['output']>;
  employee: Employee;
  employeeId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  organizationId: Scalars['ID']['output'];
  pharmacyName?: Maybe<Scalars['String']['output']>;
  primaryDoctorName?: Maybe<Scalars['String']['output']>;
  primaryDoctorPhone?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type EmployeeHrProfile = {
  __typename?: 'EmployeeHrProfile';
  bankAccountHolder?: Maybe<Scalars['String']['output']>;
  bankName?: Maybe<Scalars['String']['output']>;
  bvgInsuranceNumber?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  criminalRecordSubmitted?: Maybe<Scalars['Boolean']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  denomination?: Maybe<Scalars['String']['output']>;
  employee: Employee;
  employeeId: Scalars['ID']['output'];
  iban?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  maritalStatus?: Maybe<EmployeeMaritalStatus>;
  nationality?: Maybe<Scalars['String']['output']>;
  ndaSigned?: Maybe<Scalars['Boolean']['output']>;
  numberOfChildren?: Maybe<Scalars['Int']['output']>;
  onboardingStatus?: Maybe<EmployeeOnboardingStatus>;
  organizationId: Scalars['ID']['output'];
  residencePermitType?: Maybe<EmployeeResidencePermitType>;
  residencePermitValidUntil?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
  withholdingTaxCode?: Maybe<Scalars['String']['output']>;
};

export enum EmployeeInvitationStatus {
  Pending = 'PENDING',
  Scheduled = 'SCHEDULED',
  Sent = 'SENT'
}

export enum EmployeeMaritalStatus {
  Divorced = 'DIVORCED',
  Married = 'MARRIED',
  RegisteredPartnership = 'REGISTERED_PARTNERSHIP',
  Separated = 'SEPARATED',
  Single = 'SINGLE',
  Widowed = 'WIDOWED'
}

export type EmployeeNote = {
  __typename?: 'EmployeeNote';
  authorMembership?: Maybe<Membership>;
  authorMembershipId?: Maybe<Scalars['ID']['output']>;
  category: EmployeeNoteCategory;
  content: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  date: Scalars['String']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  employee: Employee;
  employeeId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  isConfidential: Scalars['Boolean']['output'];
  organizationId: Scalars['ID']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

/** Category of an employee note */
export enum EmployeeNoteCategory {
  Contract = 'CONTRACT',
  General = 'GENERAL',
  Meeting = 'MEETING',
  Other = 'OTHER',
  Performance = 'PERFORMANCE',
  Request = 'REQUEST',
  Warning = 'WARNING'
}

export type EmployeeOnboardingInput = {
  addressLine2?: InputMaybe<Scalars['String']['input']>;
  avatarUrl?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  contactPhone?: InputMaybe<Scalars['String']['input']>;
  contactPhone2?: InputMaybe<Scalars['String']['input']>;
  contract?: InputMaybe<OnboardingContractInput>;
  country?: InputMaybe<Scalars['String']['input']>;
  dateOfBirth?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  firstName: Scalars['String']['input'];
  houseNumber?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  language?: InputMaybe<Scalars['String']['input']>;
  lastName: Scalars['String']['input'];
  persona?: InputMaybe<Persona>;
  postalCode?: InputMaybe<Scalars['String']['input']>;
  privateEmail?: InputMaybe<Scalars['String']['input']>;
  roleIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  socialSecurityNumber?: InputMaybe<Scalars['String']['input']>;
  street?: InputMaybe<Scalars['String']['input']>;
  teamId?: InputMaybe<Scalars['ID']['input']>;
  teamRole?: InputMaybe<TeamMemberRole>;
  timeTrackingEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export enum EmployeeOnboardingStatus {
  Completed = 'COMPLETED',
  InProgress = 'IN_PROGRESS',
  NotStarted = 'NOT_STARTED'
}

export type EmployeePaidOvertime = {
  __typename?: 'EmployeePaidOvertime';
  createdAt: Scalars['DateTime']['output'];
  createdByMembershipId?: Maybe<Scalars['ID']['output']>;
  date: Scalars['String']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  employeeId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  minutes: Scalars['Int']['output'];
  note?: Maybe<Scalars['String']['output']>;
  organizationId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export enum EmployeePaymentInterval {
  MonthlyX12 = 'MONTHLY_X12',
  MonthlyX13 = 'MONTHLY_X13'
}

export type EmployeePeriodOpeningBalance = {
  __typename?: 'EmployeePeriodOpeningBalance';
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  employeeId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  openingVacationDays: Scalars['Float']['output'];
  openingWorkMinutes: Scalars['Int']['output'];
  organizationId: Scalars['ID']['output'];
  periodId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export enum EmployeeResidencePermitType {
  B = 'B',
  C = 'C',
  Citizen = 'CITIZEN',
  F = 'F',
  G = 'G',
  L = 'L',
  Other = 'OTHER'
}

export enum EmployeeStatus {
  Active = 'ACTIVE',
  Draft = 'DRAFT'
}

export type EmployeeVacation = {
  __typename?: 'EmployeeVacation';
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  employeeId: Scalars['ID']['output'];
  endDate: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  membershipId: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  organizationId: Scalars['ID']['output'];
  startDate: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type EmployeeWorkTimeOverviewRow = {
  __typename?: 'EmployeeWorkTimeOverviewRow';
  employeeId: Scalars['ID']['output'];
  employeeName?: Maybe<Scalars['String']['output']>;
  netBalanceMinutes: Scalars['Int']['output'];
  vacationDaysUsed: Scalars['Int']['output'];
};

export type EngagementTimelineBucketOutput = {
  __typename?: 'EngagementTimelineBucketOutput';
  bucketStart: Scalars['String']['output'];
  focused: Scalars['Int']['output'];
  interested: Scalars['Int']['output'];
  mechanical: Scalars['Int']['output'];
  resistant: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type EngagementTimelineOutput = {
  __typename?: 'EngagementTimelineOutput';
  buckets: Array<EngagementTimelineBucketOutput>;
  totalObserved: Scalars['Int']['output'];
};

export type Family = {
  __typename?: 'Family';
  contactPersons: Array<ContactPerson>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  name?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  primaryAddress?: Maybe<Address>;
  primaryAddressId?: Maybe<Scalars['ID']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type FinalizeEmployeeOnboardingInput = {
  id: Scalars['ID']['input'];
  invitationTiming: InvitationTiming;
};

export type FinalizeEnrollmentInput = {
  applicationId: Scalars['ID']['input'];
  enrollmentDate: Scalars['String']['input'];
  schoolClassId: Scalars['ID']['input'];
};

export type FinalizeEnrollmentOutput = {
  __typename?: 'FinalizeEnrollmentOutput';
  application: AdmissionApplication;
  student: Student;
};

/** Supported gender types */
export enum Gender {
  Female = 'FEMALE',
  Male = 'MALE',
  Other = 'OTHER'
}

export type GradeLevel = {
  __typename?: 'GradeLevel';
  ageMax?: Maybe<Scalars['Int']['output']>;
  ageMin?: Maybe<Scalars['Int']['output']>;
  classCount?: Maybe<Scalars['Int']['output']>;
  color?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  parent?: Maybe<GradeLevel>;
  parentId?: Maybe<Scalars['String']['output']>;
  shortCode?: Maybe<Scalars['String']['output']>;
  sortOrder: Scalars['Int']['output'];
  studentCount?: Maybe<Scalars['Int']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type HeatmapAreaOutput = {
  __typename?: 'HeatmapAreaOutput';
  areaId: Scalars['ID']['output'];
  areaName: Scalars['String']['output'];
};

export type HeatmapCellOutput = {
  __typename?: 'HeatmapCellOutput';
  areaId: Scalars['ID']['output'];
  count: Scalars['Int']['output'];
  status: LessonRecordStatus;
  studentId: Scalars['ID']['output'];
};

export type HeatmapStudentOutput = {
  __typename?: 'HeatmapStudentOutput';
  firstName: Scalars['String']['output'];
  lastName: Scalars['String']['output'];
  studentId: Scalars['ID']['output'];
};

export type Holiday = {
  __typename?: 'Holiday';
  canton?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  date: Scalars['String']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  organizationId: Scalars['ID']['output'];
  paidPercentage: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type ImportCurriculumPlanInput = {
  curriculumPosition?: InputMaybe<Scalars['Int']['input']>;
  curriculumSlug: Scalars['String']['input'];
  curriculumTranslations: Array<CurriculumImportPlanTranslationInput>;
  levels: Array<CurriculumImportPlanLevelInput>;
};

export enum InvitationTiming {
  Immediate = 'IMMEDIATE',
  Manual = 'MANUAL',
  OnEntryDate = 'ON_ENTRY_DATE'
}

export type LessonRecord = {
  __typename?: 'LessonRecord';
  concentration?: Maybe<LessonRecordConcentration>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  difficulty?: Maybe<LessonRecordDifficulty>;
  engagement?: Maybe<LessonRecordEngagement>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  lesson?: Maybe<CurriculumNode>;
  lessonClarityConfirmed?: Maybe<Scalars['Boolean']['output']>;
  lessonId: Scalars['ID']['output'];
  note?: Maybe<Scalars['String']['output']>;
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  persistence?: Maybe<LessonRecordPersistence>;
  recordedAt: Scalars['String']['output'];
  recordedBy?: Maybe<User>;
  recordedById?: Maybe<Scalars['ID']['output']>;
  roomMood?: Maybe<RoomMood>;
  schoolClassEnrollment?: Maybe<SchoolClassEnrollment>;
  schoolClassEnrollmentId?: Maybe<Scalars['ID']['output']>;
  selfAssessment?: Maybe<LessonRecordSelfAssessment>;
  selfAssessmentByChild: Scalars['Boolean']['output'];
  selfConfidence?: Maybe<LessonRecordSelfConfidence>;
  socialForm?: Maybe<LessonRecordSocialForm>;
  status: LessonRecordStatus;
  student?: Maybe<Student>;
  studentId: Scalars['ID']['output'];
  teacherPreparation?: Maybe<TeacherPreparation>;
  teacherStressLevel?: Maybe<TeacherStressLevel>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

/** Konzentrationsphase (Montessori-Normalisation): FLOW / PARTIAL_FOCUS / INTERRUPTED. */
export enum LessonRecordConcentration {
  Flow = 'FLOW',
  Interrupted = 'INTERRUPTED',
  PartialFocus = 'PARTIAL_FOCUS'
}

/** Schwierigkeitsgrad (ZPD): TOO_EASY / JUST_RIGHT / TOO_HARD. */
export enum LessonRecordDifficulty {
  JustRight = 'JUST_RIGHT',
  TooEasy = 'TOO_EASY',
  TooHard = 'TOO_HARD'
}

/** Beobachtetes Engagement: FOCUSED / INTERESTED / MECHANICAL / RESISTANT. */
export enum LessonRecordEngagement {
  Focused = 'FOCUSED',
  Interested = 'INTERESTED',
  Mechanical = 'MECHANICAL',
  Resistant = 'RESISTANT'
}

export type LessonRecordObservationInput = {
  concentration?: InputMaybe<LessonRecordConcentration>;
  difficulty?: InputMaybe<LessonRecordDifficulty>;
  engagement?: InputMaybe<LessonRecordEngagement>;
  lessonClarityConfirmed?: InputMaybe<Scalars['Boolean']['input']>;
  persistence?: InputMaybe<LessonRecordPersistence>;
  roomMood?: InputMaybe<RoomMood>;
  selfAssessment?: InputMaybe<LessonRecordSelfAssessment>;
  selfAssessmentByChild?: InputMaybe<Scalars['Boolean']['input']>;
  selfConfidence?: InputMaybe<LessonRecordSelfConfidence>;
  socialForm?: InputMaybe<LessonRecordSocialForm>;
  teacherPreparation?: InputMaybe<TeacherPreparation>;
  teacherStressLevel?: InputMaybe<TeacherStressLevel>;
};

/** Umgang mit Schwierigkeit: PERSISTS / SEEKS_HELP / GIVES_UP. */
export enum LessonRecordPersistence {
  GivesUp = 'GIVES_UP',
  Persists = 'PERSISTS',
  SeeksHelp = 'SEEKS_HELP'
}

/** Selbsteinschätzung des Kindes: UNDERSTOOD / PARTIAL / NEEDS_REPEAT. */
export enum LessonRecordSelfAssessment {
  NeedsRepeat = 'NEEDS_REPEAT',
  Partial = 'PARTIAL',
  Understood = 'UNDERSTOOD'
}

/** Beobachtetes Selbstvertrauen: CONFIDENT / TENTATIVE / INSECURE. */
export enum LessonRecordSelfConfidence {
  Confident = 'CONFIDENT',
  Insecure = 'INSECURE',
  Tentative = 'TENTATIVE'
}

/** Sozialform: ALONE / WITH_PARTNER / SMALL_GROUP / WITH_GUIDE. */
export enum LessonRecordSocialForm {
  Alone = 'ALONE',
  SmallGroup = 'SMALL_GROUP',
  WithGuide = 'WITH_GUIDE',
  WithPartner = 'WITH_PARTNER'
}

/** Status pro Kind × Lektion: PLANNING / INTRODUCED / PRACTICED / MASTERED / NEEDS_MORE. */
export enum LessonRecordStatus {
  Introduced = 'INTRODUCED',
  Mastered = 'MASTERED',
  NeedsMore = 'NEEDS_MORE',
  Planning = 'PLANNING',
  Practiced = 'PRACTICED'
}

export type LessonRecordsFilterInput = {
  lessonId?: InputMaybe<Scalars['ID']['input']>;
  recordedFrom?: InputMaybe<Scalars['String']['input']>;
  recordedTo?: InputMaybe<Scalars['String']['input']>;
  schoolClassId?: InputMaybe<Scalars['ID']['input']>;
  statuses?: InputMaybe<Array<LessonRecordStatus>>;
  studentId?: InputMaybe<Scalars['ID']['input']>;
};

/** Skala einer Lektion: MASTERABLE oder ONGOING (Transparent Classroom-Konvention). */
export enum LessonScale {
  Masterable = 'MASTERABLE',
  Ongoing = 'ONGOING'
}

/** Lehrer-Aktion hinter einer Lektion: P / 3PL / E / M / S (Montessori-Klassifizierung). */
export enum LessonType {
  E = 'E',
  M = 'M',
  P = 'P',
  S = 'S',
  ThreePl = 'THREE_PL'
}

export type LinkContactPersonInput = {
  contactPersonId: Scalars['ID']['input'];
  emergencyPriority?: InputMaybe<Scalars['Int']['input']>;
  hasCustody?: InputMaybe<Scalars['Boolean']['input']>;
  isPickupAuthorized?: InputMaybe<Scalars['Boolean']['input']>;
  isPrimaryContact?: InputMaybe<Scalars['Boolean']['input']>;
  livesWithStudent?: InputMaybe<Scalars['Boolean']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  relationshipType: RelationshipType;
  studentId: Scalars['ID']['input'];
};

/** Supported content locales (Schweizer Markt: DE/FR/IT + EN) */
export enum Locale {
  De = 'DE',
  En = 'EN',
  Fr = 'FR',
  It = 'IT'
}

export type Membership = {
  __typename?: 'Membership';
  contactPhone?: Maybe<Scalars['String']['output']>;
  contactPhone2?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  employee?: Maybe<Employee>;
  employeeId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  language?: Maybe<Scalars['String']['output']>;
  organization: Organization;
  organizationId: Scalars['ID']['output'];
  persona: Persona;
  roles?: Maybe<Array<Role>>;
  theme?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  user?: Maybe<User>;
  userEmail?: Maybe<UserEmail>;
  userEmailId?: Maybe<Scalars['ID']['output']>;
  userId: Scalars['ID']['output'];
  version: Scalars['Int']['output'];
};

export type MonthlyWorkTimeSummary = {
  __typename?: 'MonthlyWorkTimeSummary';
  actualMinutes: Scalars['Int']['output'];
  differenceMinutes: Scalars['Int']['output'];
  month: Scalars['Int']['output'];
  plannedMinutes: Scalars['Int']['output'];
  year: Scalars['Int']['output'];
};

export type MoveAdmissionApplicationInput = {
  id: Scalars['ID']['input'];
  position?: InputMaybe<Scalars['Int']['input']>;
  toStageId: Scalars['ID']['input'];
};

export type MoveTaskInput = {
  id: Scalars['ID']['input'];
  orderedTaskIds: Array<Scalars['ID']['input']>;
  status: TaskStatus;
};

export type Mutation = {
  __typename?: 'Mutation';
  addProjectMember: ProjectMember;
  addTaskNote: Task;
  addUserEmail: UserEmail;
  archiveAdmissionApplication: Scalars['Boolean']['output'];
  archiveAdmissionAppointmentType: Scalars['Boolean']['output'];
  archiveAdmissionRejectionReason: Scalars['Boolean']['output'];
  archiveAdmissionSource: Scalars['Boolean']['output'];
  archiveAdmissionStage: Scalars['Boolean']['output'];
  archiveConsentPurpose: Scalars['Boolean']['output'];
  archiveContactPerson: Scalars['Boolean']['output'];
  archiveCurriculum: Scalars['Boolean']['output'];
  archiveCurriculumLevel: Scalars['Boolean']['output'];
  archiveCurriculumNode: Scalars['Boolean']['output'];
  archiveEmployeeAbsenceCategory: Scalars['Boolean']['output'];
  archiveFamily: Scalars['Boolean']['output'];
  archiveProcessingActivity: Scalars['Boolean']['output'];
  archiveProject: Project;
  archiveSubprocessor: Scalars['Boolean']['output'];
  changeUserEmail: User;
  completeAdmissionReminder: AdmissionReminder;
  createAddress: Address;
  createAdmissionActivity: AdmissionActivity;
  createAdmissionApplication: AdmissionApplication;
  createAdmissionAppointment: AdmissionAppointment;
  createAdmissionAppointmentType: AdmissionAppointmentType;
  createAdmissionRejectionReason: AdmissionRejectionReason;
  createAdmissionReminder: AdmissionReminder;
  createAdmissionSource: AdmissionSource;
  createAdmissionStage: AdmissionStage;
  createCompanyVacation: CompanyVacation;
  createConsentPurpose: ConsentPurpose;
  createContactPerson: ContactPerson;
  createCountry: Country;
  createCurriculum: Curriculum;
  createCurriculumLevel: CurriculumLevel;
  createCurriculumNode: CurriculumNode;
  createDataBreach: DataBreachIncident;
  createDataSubjectRequest: DataSubjectRequest;
  createEmailTemplate: EmailTemplate;
  createEmployee: Employee;
  createEmployeeAbsenceCategory: EmployeeAbsenceCategory;
  createEmployeeAbsenceNotice: EmployeeAbsence;
  createEmployeeContract: EmployeeContract;
  createEmployeeNote: EmployeeNote;
  createEmployeePaidOvertime: EmployeePaidOvertime;
  createEmployeeVacation: EmployeeVacation;
  createEnrollment: SchoolClassEnrollment;
  createFamily: Family;
  createGradeLevel: GradeLevel;
  createHoliday: Holiday;
  createLessonRecord: LessonRecord;
  createLessonRecordsBulk: Array<LessonRecord>;
  createMembership: Membership;
  createOrganization: Organization;
  createOrganizationSetting: OrganizationSettingOutput;
  createProcessingActivity: ProcessingActivity;
  createProject: Project;
  createProjectFromTemplate: Project;
  createProjectTemplate: ProjectTemplate;
  createProtocol: Protocol;
  createProtocolTemplate: ProtocolTemplate;
  createSchoolClass: SchoolClass;
  createStudent: Student;
  createStudentNote: StudentNote;
  createSubprocessor: Subprocessor;
  createTask: Task;
  createTasksFromProtocol: Array<Task>;
  createTeam: Team;
  createTeamMember: TeamMember;
  createTimeTracking: TimeTracking;
  createUser: User;
  deleteAddress: Scalars['Boolean']['output'];
  deleteAdmissionActivity: Scalars['Boolean']['output'];
  deleteAdmissionApplication: Scalars['Boolean']['output'];
  deleteAdmissionAppointment: Scalars['Boolean']['output'];
  deleteAdmissionEmail: Scalars['Boolean']['output'];
  deleteAdmissionReminder: Scalars['Boolean']['output'];
  deleteCompanyVacation: Scalars['Boolean']['output'];
  deleteCountryInputTemplate: Scalars['Boolean']['output'];
  deleteEmailTemplate: Scalars['Boolean']['output'];
  deleteEmployeeAbsence: Scalars['Boolean']['output'];
  deleteEmployeeContract: Scalars['Boolean']['output'];
  deleteEmployeePaidOvertime: Scalars['Boolean']['output'];
  deleteEmployeePeriodOpeningBalance: Scalars['Boolean']['output'];
  deleteEmployeeVacation: Scalars['Boolean']['output'];
  deleteEnrollment: Scalars['Boolean']['output'];
  deleteGradeLevel: Scalars['Boolean']['output'];
  deleteHoliday: Scalars['Boolean']['output'];
  deleteLessonRecord: Scalars['Boolean']['output'];
  deleteOrganizationSetting: Scalars['Boolean']['output'];
  deleteProject: Scalars['Boolean']['output'];
  deleteProjectTemplate: Scalars['Boolean']['output'];
  deleteProtocol: Scalars['Boolean']['output'];
  deleteProtocolTemplate: Scalars['Boolean']['output'];
  deleteRetentionPolicy: Scalars['Boolean']['output'];
  deleteSchoolClass: Scalars['Boolean']['output'];
  deleteStudent: Scalars['Boolean']['output'];
  deleteTask: Scalars['Boolean']['output'];
  deleteTeam: Scalars['Boolean']['output'];
  deleteTeamMember: Scalars['Boolean']['output'];
  deleteTimeTracking: Scalars['Boolean']['output'];
  ensureTimeTrackingPeriod: TimeTrackingPeriod;
  executePurgeCandidate: Scalars['Boolean']['output'];
  finalizeAdmissionEnrollment: FinalizeEnrollmentOutput;
  finalizeEmployeeOnboarding: Employee;
  hardDeleteCurriculum: Scalars['Boolean']['output'];
  importCurriculumFromPlan: Curriculum;
  linkContactPersonToStudent: StudentContactPerson;
  moveAdmissionApplication: AdmissionApplication;
  moveStudentToStage: Student;
  moveTask: Task;
  recertifyAccess: Scalars['Boolean']['output'];
  recordConsent: Consent;
  rejectAdmissionApplication: AdmissionApplication;
  removeCountry: Country;
  removeOrganization: Organization;
  removeProjectMember: Scalars['Boolean']['output'];
  removeUser: User;
  removeUserEmail: UserEmail;
  reorderAdmissionApplications: Array<AdmissionApplication>;
  reorderAdmissionAppointmentTypes: Array<AdmissionAppointmentType>;
  reorderAdmissionRejectionReasons: Array<AdmissionRejectionReason>;
  reorderAdmissionSources: Array<AdmissionSource>;
  reorderAdmissionStages: Array<AdmissionStage>;
  reorderConsentPurposes: Array<ConsentPurpose>;
  reorderCurricula: Array<Curriculum>;
  reorderCurriculumLevels: Array<CurriculumLevel>;
  reorderCurriculumNodes: Array<CurriculumNode>;
  reorderEmployeeAbsenceCategories: Array<EmployeeAbsenceCategory>;
  reorderGradeLevels: Array<GradeLevel>;
  reorderMyTasks: Scalars['Boolean']['output'];
  reorderSchoolClasses: Array<SchoolClass>;
  reorderTeams: Array<Team>;
  resendAdmissionEmail: AdmissionEmail;
  restoreAdmissionApplication: AdmissionApplication;
  resyncSystemEmployeeAbsenceCategoryTranslations: Scalars['Boolean']['output'];
  reviewPurgeCandidate: Scalars['Boolean']['output'];
  saveProjectAsTemplate: ProjectTemplate;
  saveProtocolAsTemplate: ProtocolTemplate;
  scanRetention: Scalars['Int']['output'];
  seedSystemEmployeeAbsenceCategories: Scalars['Boolean']['output'];
  sendAdmissionEmail: AdmissionEmail;
  sendEmployeeInvitation: Employee;
  setEmployeeAbsenceCategoryActive: EmployeeAbsenceCategory;
  setLessonPrerequisites: CurriculumNode;
  setPrimaryUserEmail: UserEmail;
  setTimeTrackingPeriodStatus: TimeTrackingPeriod;
  softDeleteEmployeeNote: EmployeeNote;
  softDeleteStudentNote: StudentNote;
  startTimeTracking: TimeTracking;
  stopTimeTracking: TimeTracking;
  transferStudentToSchoolClass?: Maybe<SchoolClassEnrollment>;
  unarchiveCurriculum: Curriculum;
  unarchiveCurriculumNode: Scalars['Boolean']['output'];
  uncompleteAdmissionReminder: AdmissionReminder;
  unlinkContactPersonFromStudent: Scalars['Boolean']['output'];
  updateAddress: Address;
  updateAdmissionActivity: AdmissionActivity;
  updateAdmissionApplication: AdmissionApplication;
  updateAdmissionAppointment: AdmissionAppointment;
  updateAdmissionAppointmentType: AdmissionAppointmentType;
  updateAdmissionBoardSettings: AdmissionBoardSettings;
  updateAdmissionRejectionReason: AdmissionRejectionReason;
  updateAdmissionReminder: AdmissionReminder;
  updateAdmissionSource: AdmissionSource;
  updateAdmissionStage: AdmissionStage;
  updateCompanyVacation: CompanyVacation;
  updateConsentPurpose: ConsentPurpose;
  updateContactPerson: ContactPerson;
  updateCountry: Country;
  updateCurriculum: Curriculum;
  updateCurriculumLevel: CurriculumLevel;
  updateCurriculumNode: CurriculumNode;
  updateDataBreach: DataBreachIncident;
  updateDataSubjectRequest: DataSubjectRequest;
  updateEmailTemplate: EmailTemplate;
  updateEmployee: Employee;
  updateEmployeeAbsence: EmployeeAbsence;
  updateEmployeeAbsenceCategory: EmployeeAbsenceCategory;
  updateEmployeeContract: EmployeeContract;
  updateEmployeeNote: EmployeeNote;
  updateEmployeePaidOvertime: EmployeePaidOvertime;
  updateEmployeeVacation: EmployeeVacation;
  updateEnrollment: SchoolClassEnrollment;
  updateFamily: Family;
  updateGradeLevel: GradeLevel;
  updateHoliday: Holiday;
  updateLessonRecord: LessonRecord;
  updateMembership: Membership;
  updateMyTheme: Scalars['Boolean']['output'];
  updateOrganization: Organization;
  updateOrganizationSetting: OrganizationSettingOutput;
  updateProcessingActivity: ProcessingActivity;
  updateProject: Project;
  updateProjectMemberRole: ProjectMember;
  updateProjectTemplate: ProjectTemplate;
  updateProtocol: Protocol;
  updateProtocolTemplate: ProtocolTemplate;
  updateRecordKeepingSettings: RecordKeepingSettings;
  updateRolePermissions: Role;
  updateSchoolClass: SchoolClass;
  updateStudent: Student;
  updateStudentContactPersonLink: StudentContactPerson;
  updateStudentNote: StudentNote;
  updateSubprocessor: Subprocessor;
  updateTask: Task;
  updateTeam: Team;
  updateTeamMember: TeamMember;
  updateTimeTracking: TimeTracking;
  updateUser: User;
  upsertCountryInputTemplate: CountryInputTemplate;
  upsertCurriculumLevelTranslation: CurriculumLevelTranslation;
  upsertCurriculumNodeTranslation: CurriculumNodeTranslation;
  upsertCurriculumTranslation: CurriculumTranslation;
  upsertEmployeeAbsenceCategoryTranslation: EmployeeAbsenceCategoryTranslation;
  upsertEmployeeEmergencyProfile: EmployeeEmergencyProfile;
  upsertEmployeeHrProfile: EmployeeHrProfile;
  upsertEmployeeOnboardingDraft: Employee;
  upsertEmployeePeriodOpeningBalance: EmployeePeriodOpeningBalance;
  upsertRetentionPolicy: RetentionPolicy;
  withdrawConsent: Consent;
};


export type MutationAddProjectMemberArgs = {
  input: AddProjectMemberInput;
};


export type MutationAddTaskNoteArgs = {
  input: AddTaskNoteInput;
};


export type MutationAddUserEmailArgs = {
  email: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationArchiveAdmissionApplicationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationArchiveAdmissionAppointmentTypeArgs = {
  id: Scalars['ID']['input'];
};


export type MutationArchiveAdmissionRejectionReasonArgs = {
  id: Scalars['ID']['input'];
};


export type MutationArchiveAdmissionSourceArgs = {
  id: Scalars['ID']['input'];
};


export type MutationArchiveAdmissionStageArgs = {
  id: Scalars['ID']['input'];
};


export type MutationArchiveConsentPurposeArgs = {
  id: Scalars['ID']['input'];
};


export type MutationArchiveContactPersonArgs = {
  id: Scalars['ID']['input'];
};


export type MutationArchiveCurriculumArgs = {
  id: Scalars['ID']['input'];
};


export type MutationArchiveCurriculumLevelArgs = {
  id: Scalars['ID']['input'];
};


export type MutationArchiveCurriculumNodeArgs = {
  id: Scalars['ID']['input'];
};


export type MutationArchiveEmployeeAbsenceCategoryArgs = {
  id: Scalars['ID']['input'];
};


export type MutationArchiveFamilyArgs = {
  id: Scalars['ID']['input'];
};


export type MutationArchiveProcessingActivityArgs = {
  id: Scalars['ID']['input'];
};


export type MutationArchiveProjectArgs = {
  archived?: Scalars['Boolean']['input'];
  id: Scalars['ID']['input'];
};


export type MutationArchiveSubprocessorArgs = {
  id: Scalars['ID']['input'];
};


export type MutationChangeUserEmailArgs = {
  input: ChangeUserEmailInput;
};


export type MutationCompleteAdmissionReminderArgs = {
  id: Scalars['ID']['input'];
};


export type MutationCreateAddressArgs = {
  input: CreateAddressInput;
};


export type MutationCreateAdmissionActivityArgs = {
  input: CreateAdmissionActivityInput;
};


export type MutationCreateAdmissionApplicationArgs = {
  input: CreateAdmissionApplicationInput;
};


export type MutationCreateAdmissionAppointmentArgs = {
  input: CreateAdmissionAppointmentInput;
};


export type MutationCreateAdmissionAppointmentTypeArgs = {
  input: CreateAdmissionAppointmentTypeInput;
};


export type MutationCreateAdmissionRejectionReasonArgs = {
  input: CreateAdmissionRejectionReasonInput;
};


export type MutationCreateAdmissionReminderArgs = {
  input: CreateAdmissionReminderInput;
};


export type MutationCreateAdmissionSourceArgs = {
  input: CreateAdmissionSourceInput;
};


export type MutationCreateAdmissionStageArgs = {
  input: CreateAdmissionStageInput;
};


export type MutationCreateCompanyVacationArgs = {
  input: CreateCompanyVacationInput;
};


export type MutationCreateConsentPurposeArgs = {
  input: CreateConsentPurposeInput;
};


export type MutationCreateContactPersonArgs = {
  input: CreateContactPersonInput;
};


export type MutationCreateCountryArgs = {
  createCountryInput: CreateCountryInput;
};


export type MutationCreateCurriculumArgs = {
  input: CreateCurriculumInput;
};


export type MutationCreateCurriculumLevelArgs = {
  input: CreateCurriculumLevelInput;
};


export type MutationCreateCurriculumNodeArgs = {
  input: CreateCurriculumNodeInput;
};


export type MutationCreateDataBreachArgs = {
  input: CreateDataBreachInput;
};


export type MutationCreateDataSubjectRequestArgs = {
  input: CreateDataSubjectRequestInput;
};


export type MutationCreateEmailTemplateArgs = {
  input: CreateEmailTemplateInput;
};


export type MutationCreateEmployeeArgs = {
  createEmployeeInput: CreateEmployeeInput;
};


export type MutationCreateEmployeeAbsenceCategoryArgs = {
  input: CreateEmployeeAbsenceCategoryInput;
};


export type MutationCreateEmployeeAbsenceNoticeArgs = {
  createEmployeeAbsenceInput: CreateEmployeeAbsenceNoticeInput;
};


export type MutationCreateEmployeeContractArgs = {
  input: CreateEmployeeContractInput;
};


export type MutationCreateEmployeeNoteArgs = {
  createEmployeeNoteInput: CreateEmployeeNoteInput;
};


export type MutationCreateEmployeePaidOvertimeArgs = {
  input: CreateEmployeePaidOvertimeInput;
};


export type MutationCreateEmployeeVacationArgs = {
  input: CreateEmployeeVacationInput;
};


export type MutationCreateEnrollmentArgs = {
  input: CreateSchoolClassEnrollmentInput;
};


export type MutationCreateFamilyArgs = {
  input: CreateFamilyInput;
};


export type MutationCreateGradeLevelArgs = {
  input: CreateGradeLevelInput;
};


export type MutationCreateHolidayArgs = {
  input: CreateHolidayInput;
};


export type MutationCreateLessonRecordArgs = {
  input: CreateLessonRecordInput;
};


export type MutationCreateLessonRecordsBulkArgs = {
  input: CreateLessonRecordsBulkInput;
};


export type MutationCreateMembershipArgs = {
  createMembershipInput: CreateMembershipInput;
};


export type MutationCreateOrganizationSettingArgs = {
  input: CreateOrganizationSettingInput;
};


export type MutationCreateProcessingActivityArgs = {
  input: CreateProcessingActivityInput;
};


export type MutationCreateProjectArgs = {
  input: CreateProjectInput;
};


export type MutationCreateProjectFromTemplateArgs = {
  input: CreateProjectFromTemplateInput;
};


export type MutationCreateProjectTemplateArgs = {
  input: CreateProjectTemplateInput;
};


export type MutationCreateProtocolArgs = {
  input: CreateProtocolInput;
};


export type MutationCreateProtocolTemplateArgs = {
  input: CreateProtocolTemplateInput;
};


export type MutationCreateSchoolClassArgs = {
  input: CreateSchoolClassInput;
};


export type MutationCreateStudentArgs = {
  input: CreateStudentInput;
};


export type MutationCreateStudentNoteArgs = {
  createStudentNoteInput: CreateStudentNoteInput;
};


export type MutationCreateSubprocessorArgs = {
  input: CreateSubprocessorInput;
};


export type MutationCreateTaskArgs = {
  input: CreateTaskInput;
};


export type MutationCreateTasksFromProtocolArgs = {
  input: CreateTasksFromProtocolInput;
};


export type MutationCreateTeamArgs = {
  input: CreateTeamInput;
};


export type MutationCreateTeamMemberArgs = {
  input: CreateTeamMemberInput;
};


export type MutationCreateTimeTrackingArgs = {
  input: CreateTimeTrackingInput;
};


export type MutationCreateUserArgs = {
  createUserInput: CreateUserInput;
};


export type MutationDeleteAddressArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteAdmissionActivityArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteAdmissionApplicationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteAdmissionAppointmentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteAdmissionEmailArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteAdmissionReminderArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteCompanyVacationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteCountryInputTemplateArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteEmailTemplateArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteEmployeeAbsenceArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteEmployeeContractArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteEmployeePaidOvertimeArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteEmployeePeriodOpeningBalanceArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteEmployeeVacationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteEnrollmentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteGradeLevelArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteHolidayArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteLessonRecordArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteOrganizationSettingArgs = {
  key: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
};


export type MutationDeleteProjectArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteProjectTemplateArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteProtocolArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteProtocolTemplateArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteRetentionPolicyArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteSchoolClassArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteStudentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTaskArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTeamArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTeamMemberArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTimeTrackingArgs = {
  id: Scalars['ID']['input'];
};


export type MutationEnsureTimeTrackingPeriodArgs = {
  date: Scalars['String']['input'];
};


export type MutationExecutePurgeCandidateArgs = {
  id: Scalars['ID']['input'];
};


export type MutationFinalizeAdmissionEnrollmentArgs = {
  input: FinalizeEnrollmentInput;
};


export type MutationFinalizeEmployeeOnboardingArgs = {
  input: FinalizeEmployeeOnboardingInput;
};


export type MutationHardDeleteCurriculumArgs = {
  id: Scalars['ID']['input'];
};


export type MutationImportCurriculumFromPlanArgs = {
  input: ImportCurriculumPlanInput;
};


export type MutationLinkContactPersonToStudentArgs = {
  input: LinkContactPersonInput;
};


export type MutationMoveAdmissionApplicationArgs = {
  input: MoveAdmissionApplicationInput;
};


export type MutationMoveStudentToStageArgs = {
  stageId: Scalars['ID']['input'];
  studentId: Scalars['ID']['input'];
};


export type MutationMoveTaskArgs = {
  input: MoveTaskInput;
};


export type MutationRecertifyAccessArgs = {
  membershipId: Scalars['ID']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRecordConsentArgs = {
  input: RecordConsentInput;
};


export type MutationRejectAdmissionApplicationArgs = {
  input: RejectAdmissionApplicationInput;
};


export type MutationRemoveCountryArgs = {
  id: Scalars['Int']['input'];
};


export type MutationRemoveOrganizationArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveProjectMemberArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRemoveUserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRemoveUserEmailArgs = {
  id: Scalars['ID']['input'];
};


export type MutationReorderAdmissionApplicationsArgs = {
  input: ReorderAdmissionApplicationsInput;
};


export type MutationReorderAdmissionAppointmentTypesArgs = {
  input: ReorderAdmissionAppointmentTypesInput;
};


export type MutationReorderAdmissionRejectionReasonsArgs = {
  input: ReorderAdmissionRejectionReasonsInput;
};


export type MutationReorderAdmissionSourcesArgs = {
  input: ReorderAdmissionSourcesInput;
};


export type MutationReorderAdmissionStagesArgs = {
  input: ReorderAdmissionStagesInput;
};


export type MutationReorderConsentPurposesArgs = {
  input: ReorderConsentPurposesInput;
};


export type MutationReorderCurriculaArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type MutationReorderCurriculumLevelsArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type MutationReorderCurriculumNodesArgs = {
  input: ReorderCurriculumNodesInput;
};


export type MutationReorderEmployeeAbsenceCategoriesArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type MutationReorderGradeLevelsArgs = {
  input: ReorderGradeLevelsInput;
};


export type MutationReorderMyTasksArgs = {
  orderedTaskIds: Array<Scalars['ID']['input']>;
};


export type MutationReorderSchoolClassesArgs = {
  input: ReorderSchoolClassesInput;
};


export type MutationReorderTeamsArgs = {
  input: ReorderTeamsInput;
};


export type MutationResendAdmissionEmailArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRestoreAdmissionApplicationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationResyncSystemEmployeeAbsenceCategoryTranslationsArgs = {
  orgId: Scalars['ID']['input'];
};


export type MutationReviewPurgeCandidateArgs = {
  approve: Scalars['Boolean']['input'];
  id: Scalars['ID']['input'];
};


export type MutationSaveProjectAsTemplateArgs = {
  input: SaveProjectAsTemplateInput;
};


export type MutationSaveProtocolAsTemplateArgs = {
  input: SaveProtocolAsTemplateInput;
};


export type MutationSeedSystemEmployeeAbsenceCategoriesArgs = {
  orgId: Scalars['ID']['input'];
};


export type MutationSendAdmissionEmailArgs = {
  input: SendAdmissionEmailInput;
};


export type MutationSendEmployeeInvitationArgs = {
  employeeId: Scalars['ID']['input'];
};


export type MutationSetEmployeeAbsenceCategoryActiveArgs = {
  id: Scalars['ID']['input'];
  isActive: Scalars['Boolean']['input'];
};


export type MutationSetLessonPrerequisitesArgs = {
  input: SetLessonPrerequisitesInput;
};


export type MutationSetPrimaryUserEmailArgs = {
  id: Scalars['ID']['input'];
};


export type MutationSetTimeTrackingPeriodStatusArgs = {
  id: Scalars['ID']['input'];
  status: TimeTrackingPeriodStatus;
};


export type MutationSoftDeleteEmployeeNoteArgs = {
  id: Scalars['ID']['input'];
};


export type MutationSoftDeleteStudentNoteArgs = {
  id: Scalars['ID']['input'];
};


export type MutationStartTimeTrackingArgs = {
  employeeId: Scalars['ID']['input'];
};


export type MutationStopTimeTrackingArgs = {
  employeeId: Scalars['ID']['input'];
};


export type MutationTransferStudentToSchoolClassArgs = {
  input: TransferStudentInput;
};


export type MutationUnarchiveCurriculumArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUnarchiveCurriculumNodeArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUncompleteAdmissionReminderArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUnlinkContactPersonFromStudentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateAddressArgs = {
  input: UpdateAddressInput;
};


export type MutationUpdateAdmissionActivityArgs = {
  input: UpdateAdmissionActivityInput;
};


export type MutationUpdateAdmissionApplicationArgs = {
  input: UpdateAdmissionApplicationInput;
};


export type MutationUpdateAdmissionAppointmentArgs = {
  input: UpdateAdmissionAppointmentInput;
};


export type MutationUpdateAdmissionAppointmentTypeArgs = {
  input: UpdateAdmissionAppointmentTypeInput;
};


export type MutationUpdateAdmissionBoardSettingsArgs = {
  input: UpdateAdmissionBoardSettingsInput;
};


export type MutationUpdateAdmissionRejectionReasonArgs = {
  input: UpdateAdmissionRejectionReasonInput;
};


export type MutationUpdateAdmissionReminderArgs = {
  input: UpdateAdmissionReminderInput;
};


export type MutationUpdateAdmissionSourceArgs = {
  input: UpdateAdmissionSourceInput;
};


export type MutationUpdateAdmissionStageArgs = {
  input: UpdateAdmissionStageInput;
};


export type MutationUpdateCompanyVacationArgs = {
  input: UpdateCompanyVacationInput;
};


export type MutationUpdateConsentPurposeArgs = {
  input: UpdateConsentPurposeInput;
};


export type MutationUpdateContactPersonArgs = {
  input: UpdateContactPersonInput;
};


export type MutationUpdateCountryArgs = {
  updateCountryInput: UpdateCountryInput;
};


export type MutationUpdateCurriculumArgs = {
  input: UpdateCurriculumInput;
};


export type MutationUpdateCurriculumLevelArgs = {
  input: UpdateCurriculumLevelInput;
};


export type MutationUpdateCurriculumNodeArgs = {
  input: UpdateCurriculumNodeInput;
};


export type MutationUpdateDataBreachArgs = {
  input: UpdateDataBreachInput;
};


export type MutationUpdateDataSubjectRequestArgs = {
  input: UpdateDataSubjectRequestInput;
};


export type MutationUpdateEmailTemplateArgs = {
  input: UpdateEmailTemplateInput;
};


export type MutationUpdateEmployeeArgs = {
  updateEmployeeInput: UpdateEmployeeInput;
};


export type MutationUpdateEmployeeAbsenceArgs = {
  updateEmployeeAbsenceInput: UpdateEmployeeAbsenceInput;
};


export type MutationUpdateEmployeeAbsenceCategoryArgs = {
  input: UpdateEmployeeAbsenceCategoryInput;
};


export type MutationUpdateEmployeeContractArgs = {
  input: UpdateEmployeeContractInput;
};


export type MutationUpdateEmployeeNoteArgs = {
  updateEmployeeNoteInput: UpdateEmployeeNoteInput;
};


export type MutationUpdateEmployeePaidOvertimeArgs = {
  input: UpdateEmployeePaidOvertimeInput;
};


export type MutationUpdateEmployeeVacationArgs = {
  input: UpdateEmployeeVacationInput;
};


export type MutationUpdateEnrollmentArgs = {
  input: UpdateSchoolClassEnrollmentInput;
};


export type MutationUpdateFamilyArgs = {
  input: UpdateFamilyInput;
};


export type MutationUpdateGradeLevelArgs = {
  input: UpdateGradeLevelInput;
};


export type MutationUpdateHolidayArgs = {
  input: UpdateHolidayInput;
};


export type MutationUpdateLessonRecordArgs = {
  input: UpdateLessonRecordInput;
};


export type MutationUpdateMembershipArgs = {
  updateMembershipInput: UpdateMembershipInput;
};


export type MutationUpdateMyThemeArgs = {
  input: UpdateMyThemeInput;
};


export type MutationUpdateOrganizationArgs = {
  updateOrganizationInput: UpdateOrganizationInput;
};


export type MutationUpdateOrganizationSettingArgs = {
  input: UpdateOrganizationSettingInput;
};


export type MutationUpdateProcessingActivityArgs = {
  input: UpdateProcessingActivityInput;
};


export type MutationUpdateProjectArgs = {
  input: UpdateProjectInput;
};


export type MutationUpdateProjectMemberRoleArgs = {
  input: UpdateProjectMemberRoleInput;
};


export type MutationUpdateProjectTemplateArgs = {
  input: UpdateProjectTemplateInput;
};


export type MutationUpdateProtocolArgs = {
  input: UpdateProtocolInput;
};


export type MutationUpdateProtocolTemplateArgs = {
  input: UpdateProtocolTemplateInput;
};


export type MutationUpdateRecordKeepingSettingsArgs = {
  input: UpdateRecordKeepingSettingsInput;
};


export type MutationUpdateRolePermissionsArgs = {
  input: UpdateRolePermissionsInput;
};


export type MutationUpdateSchoolClassArgs = {
  input: UpdateSchoolClassInput;
};


export type MutationUpdateStudentArgs = {
  input: UpdateStudentInput;
};


export type MutationUpdateStudentContactPersonLinkArgs = {
  input: UpdateStudentContactPersonInput;
};


export type MutationUpdateStudentNoteArgs = {
  updateStudentNoteInput: UpdateStudentNoteInput;
};


export type MutationUpdateSubprocessorArgs = {
  input: UpdateSubprocessorInput;
};


export type MutationUpdateTaskArgs = {
  input: UpdateTaskInput;
};


export type MutationUpdateTeamArgs = {
  input: UpdateTeamInput;
};


export type MutationUpdateTeamMemberArgs = {
  input: UpdateTeamMemberInput;
};


export type MutationUpdateTimeTrackingArgs = {
  input: UpdateTimeTrackingInput;
};


export type MutationUpdateUserArgs = {
  updateUserInput: UpdateUserInput;
};


export type MutationUpsertCountryInputTemplateArgs = {
  input: UpsertCountryInputTemplateInput;
};


export type MutationUpsertCurriculumLevelTranslationArgs = {
  input: UpsertCurriculumLevelTranslationInput;
};


export type MutationUpsertCurriculumNodeTranslationArgs = {
  input: UpsertCurriculumNodeTranslationInput;
};


export type MutationUpsertCurriculumTranslationArgs = {
  input: UpsertCurriculumTranslationInput;
};


export type MutationUpsertEmployeeAbsenceCategoryTranslationArgs = {
  input: UpsertEmployeeAbsenceCategoryTranslationInput;
};


export type MutationUpsertEmployeeEmergencyProfileArgs = {
  input: UpsertEmployeeEmergencyProfileInput;
};


export type MutationUpsertEmployeeHrProfileArgs = {
  input: UpsertEmployeeHrProfileInput;
};


export type MutationUpsertEmployeeOnboardingDraftArgs = {
  input: EmployeeOnboardingInput;
};


export type MutationUpsertEmployeePeriodOpeningBalanceArgs = {
  input: UpsertEmployeePeriodOpeningBalanceInput;
};


export type MutationUpsertRetentionPolicyArgs = {
  input: UpsertRetentionPolicyInput;
};


export type MutationWithdrawConsentArgs = {
  input: WithdrawConsentInput;
};

export type OnboardingContractInput = {
  annualVacationDays?: InputMaybe<Scalars['Int']['input']>;
  contractType?: InputMaybe<EmployeeContractType>;
  documentUrl?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  position?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  weekdayTimeWindows?: InputMaybe<WeekdayTimeWindowsInput>;
  weeklyHours?: InputMaybe<Scalars['String']['input']>;
  workloadPercent?: InputMaybe<Scalars['Float']['input']>;
};

export type Organization = {
  __typename?: 'Organization';
  bvgContactPhone?: Maybe<Scalars['String']['output']>;
  bvgProvider?: Maybe<Scalars['String']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  dailySicknessContactPhone?: Maybe<Scalars['String']['output']>;
  dailySicknessProvider?: Maybe<Scalars['String']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  domain?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  latitude?: Maybe<Scalars['Float']['output']>;
  longitude?: Maybe<Scalars['Float']['output']>;
  memberships?: Maybe<Array<Membership>>;
  name?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  roles?: Maybe<Array<Role>>;
  street?: Maybe<Scalars['String']['output']>;
  subdomain?: Maybe<Scalars['String']['output']>;
  teamIds?: Maybe<Array<Scalars['ID']['output']>>;
  teams?: Maybe<Array<Team>>;
  timezone: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  uvgContactPhone?: Maybe<Scalars['String']['output']>;
  uvgProvider?: Maybe<Scalars['String']['output']>;
  version: Scalars['Int']['output'];
  website?: Maybe<Scalars['String']['output']>;
  zip?: Maybe<Scalars['String']['output']>;
};

export type OrganizationSettingOutput = {
  __typename?: 'OrganizationSettingOutput';
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  hasValue: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  organizationId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  value?: Maybe<Scalars['String']['output']>;
  version: Scalars['Int']['output'];
};

export type Permission = {
  __typename?: 'Permission';
  code: PermissionCode;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  roles?: Maybe<Array<Role>>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

/** Supported Permission Codes */
export enum PermissionCode {
  AddressDelete = 'ADDRESS_DELETE',
  AddressRead = 'ADDRESS_READ',
  AddressWrite = 'ADDRESS_WRITE',
  AdmissionApplicationDelete = 'ADMISSION_APPLICATION_DELETE',
  AdmissionApplicationEnroll = 'ADMISSION_APPLICATION_ENROLL',
  AdmissionApplicationMove = 'ADMISSION_APPLICATION_MOVE',
  AdmissionApplicationRead = 'ADMISSION_APPLICATION_READ',
  AdmissionApplicationWrite = 'ADMISSION_APPLICATION_WRITE',
  AdmissionEmailSend = 'ADMISSION_EMAIL_SEND',
  AdmissionEmailTemplateManage = 'ADMISSION_EMAIL_TEMPLATE_MANAGE',
  AdmissionStageManage = 'ADMISSION_STAGE_MANAGE',
  AdmissionStageRead = 'ADMISSION_STAGE_READ',
  BillingManage = 'BILLING_MANAGE',
  ConsentManage = 'CONSENT_MANAGE',
  ConsentRead = 'CONSENT_READ',
  ConsentSettingsManage = 'CONSENT_SETTINGS_MANAGE',
  ContactPersonDelete = 'CONTACT_PERSON_DELETE',
  ContactPersonRead = 'CONTACT_PERSON_READ',
  ContactPersonWrite = 'CONTACT_PERSON_WRITE',
  CurriculumLevelManage = 'CURRICULUM_LEVEL_MANAGE',
  CurriculumLevelRead = 'CURRICULUM_LEVEL_READ',
  CurriculumManage = 'CURRICULUM_MANAGE',
  CurriculumRead = 'CURRICULUM_READ',
  DataBreachManage = 'DATA_BREACH_MANAGE',
  DataBreachRead = 'DATA_BREACH_READ',
  DataRequestManage = 'DATA_REQUEST_MANAGE',
  DataRequestRead = 'DATA_REQUEST_READ',
  EmployeeAbsenceCategoryManage = 'EMPLOYEE_ABSENCE_CATEGORY_MANAGE',
  EmployeeAbsenceCategoryRead = 'EMPLOYEE_ABSENCE_CATEGORY_READ',
  EmployeeRead = 'EMPLOYEE_READ',
  EmployeeWrite = 'EMPLOYEE_WRITE',
  FamilyRead = 'FAMILY_READ',
  FamilyWrite = 'FAMILY_WRITE',
  OrgDelete = 'ORG_DELETE',
  OrgTransferOwnership = 'ORG_TRANSFER_OWNERSHIP',
  ProjectCreate = 'PROJECT_CREATE',
  ProjectManageAll = 'PROJECT_MANAGE_ALL',
  ProjectRead = 'PROJECT_READ',
  ProjectTemplateManage = 'PROJECT_TEMPLATE_MANAGE',
  ProtocolDelete = 'PROTOCOL_DELETE',
  ProtocolRead = 'PROTOCOL_READ',
  ProtocolWrite = 'PROTOCOL_WRITE',
  RecordKeepingRead = 'RECORD_KEEPING_READ',
  RecordKeepingSettingsManage = 'RECORD_KEEPING_SETTINGS_MANAGE',
  RecordKeepingWrite = 'RECORD_KEEPING_WRITE',
  RetentionManage = 'RETENTION_MANAGE',
  RetentionRead = 'RETENTION_READ',
  RoleAssign = 'ROLE_ASSIGN',
  RoleCreate = 'ROLE_CREATE',
  RoleDelete = 'ROLE_DELETE',
  SchoolClassDelete = 'SCHOOL_CLASS_DELETE',
  SchoolClassRead = 'SCHOOL_CLASS_READ',
  SchoolClassWrite = 'SCHOOL_CLASS_WRITE',
  TeamCreate = 'TEAM_CREATE',
  TeamDelete = 'TEAM_DELETE',
  TeamManage = 'TEAM_MANAGE',
  TimesheetRead = 'TIMESHEET_READ',
  TimesheetWrite = 'TIMESHEET_WRITE',
  UserInvite = 'USER_INVITE',
  UserRemove = 'USER_REMOVE',
  VvtManage = 'VVT_MANAGE',
  VvtRead = 'VVT_READ'
}

export enum Persona {
  Admin = 'ADMIN',
  Employee = 'EMPLOYEE',
  Hr = 'HR',
  Office = 'OFFICE',
  Parent = 'PARENT',
  Student = 'STUDENT',
  Teacher = 'TEACHER'
}

export type ProcessingActivity = {
  __typename?: 'ProcessingActivity';
  createdAt: Scalars['DateTime']['output'];
  dataCategories?: Maybe<Scalars['String']['output']>;
  dataSubjects?: Maybe<Scalars['String']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  legalBasis: ConsentLegalBasis;
  name: Scalars['String']['output'];
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  purpose?: Maybe<Scalars['String']['output']>;
  recipients?: Maybe<Scalars['String']['output']>;
  retentionNote?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type Project = {
  __typename?: 'Project';
  color?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<Membership>;
  createdByMembershipId?: Maybe<Scalars['ID']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  dueDate?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  members?: Maybe<Array<ProjectMember>>;
  organization?: Maybe<Organization>;
  organizationId: Scalars['ID']['output'];
  status: ProjectStatus;
  taskStats: ProjectTaskStats;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type ProjectMember = {
  __typename?: 'ProjectMember';
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  membership?: Maybe<Membership>;
  membershipId: Scalars['ID']['output'];
  organization?: Maybe<Organization>;
  organizationId: Scalars['ID']['output'];
  project?: Maybe<Project>;
  projectId: Scalars['ID']['output'];
  role: ProjectMemberRole;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

/** Role of a membership within a project (OWNER or MEMBER) */
export enum ProjectMemberRole {
  Member = 'MEMBER',
  Owner = 'OWNER'
}

/** Lifecycle status of a project (board) */
export enum ProjectStatus {
  Active = 'ACTIVE',
  Completed = 'COMPLETED',
  OnHold = 'ON_HOLD'
}

export type ProjectTaskStats = {
  __typename?: 'ProjectTaskStats';
  done: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type ProjectTemplate = {
  __typename?: 'ProjectTemplate';
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<Membership>;
  createdByMembershipId?: Maybe<Scalars['ID']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  organization?: Maybe<Organization>;
  organizationId: Scalars['ID']['output'];
  tasks?: Maybe<Array<ProjectTemplateTask>>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type ProjectTemplateTask = {
  __typename?: 'ProjectTemplateTask';
  createdAt: Scalars['DateTime']['output'];
  defaultAssigneeRole?: Maybe<SystemRole>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  dueOffsetDays?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  organization?: Maybe<Organization>;
  organizationId: Scalars['ID']['output'];
  priority: TaskPriority;
  sortOrder: Scalars['Int']['output'];
  template?: Maybe<ProjectTemplate>;
  templateId: Scalars['ID']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type Protocol = {
  __typename?: 'Protocol';
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<Membership>;
  createdByMembershipId?: Maybe<Scalars['ID']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  endTime?: Maybe<Scalars['String']['output']>;
  externalParticipants: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  meetingDate?: Maybe<Scalars['String']['output']>;
  organization?: Maybe<Organization>;
  organizationId: Scalars['ID']['output'];
  participants?: Maybe<Array<ProtocolParticipant>>;
  project?: Maybe<Project>;
  projectId?: Maybe<Scalars['ID']['output']>;
  sections: ProtocolSections;
  startTime?: Maybe<Scalars['String']['output']>;
  status: ProtocolStatus;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type ProtocolChallenge = {
  __typename?: 'ProtocolChallenge';
  challenge?: Maybe<Scalars['String']['output']>;
  supportNeeded?: Maybe<Scalars['String']['output']>;
  topic: Scalars['String']['output'];
};

export type ProtocolChallengeInput = {
  challenge?: InputMaybe<Scalars['String']['input']>;
  supportNeeded?: InputMaybe<Scalars['String']['input']>;
  topic: Scalars['String']['input'];
};

export type ProtocolCommunication = {
  __typename?: 'ProtocolCommunication';
  audience?: Maybe<Scalars['String']['output']>;
  channel?: Maybe<Scalars['String']['output']>;
  dueDate?: Maybe<Scalars['String']['output']>;
  responsible?: Maybe<Scalars['String']['output']>;
  topic: Scalars['String']['output'];
};

export type ProtocolCommunicationInput = {
  audience?: InputMaybe<Scalars['String']['input']>;
  channel?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['String']['input']>;
  responsible?: InputMaybe<Scalars['String']['input']>;
  topic: Scalars['String']['input'];
};

export type ProtocolDecision = {
  __typename?: 'ProtocolDecision';
  decision?: Maybe<Scalars['String']['output']>;
  dueDate?: Maybe<Scalars['String']['output']>;
  responsible?: Maybe<Scalars['String']['output']>;
  topic: Scalars['String']['output'];
};

export type ProtocolDecisionInput = {
  decision?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['String']['input']>;
  responsible?: InputMaybe<Scalars['String']['input']>;
  topic: Scalars['String']['input'];
};

export type ProtocolOpenPoint = {
  __typename?: 'ProtocolOpenPoint';
  forNextMeeting: Scalars['Boolean']['output'];
  nextStep?: Maybe<Scalars['String']['output']>;
  topic: Scalars['String']['output'];
};

export type ProtocolOpenPointInput = {
  forNextMeeting?: InputMaybe<Scalars['Boolean']['input']>;
  nextStep?: InputMaybe<Scalars['String']['input']>;
  topic: Scalars['String']['input'];
};

export type ProtocolParticipant = {
  __typename?: 'ProtocolParticipant';
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  membership?: Maybe<Membership>;
  membershipId: Scalars['ID']['output'];
  organization?: Maybe<Organization>;
  organizationId: Scalars['ID']['output'];
  protocol?: Maybe<Protocol>;
  protocolId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type ProtocolSections = {
  __typename?: 'ProtocolSections';
  agendaItems: Array<AgendaItem>;
  challenges: Array<ProtocolChallenge>;
  communications: Array<ProtocolCommunication>;
  decisions: Array<ProtocolDecision>;
  infoPoints: Array<Scalars['String']['output']>;
  openPoints: Array<ProtocolOpenPoint>;
};

export type ProtocolSectionsInput = {
  agendaItems?: InputMaybe<Array<AgendaItemInput>>;
  challenges?: InputMaybe<Array<ProtocolChallengeInput>>;
  communications?: InputMaybe<Array<ProtocolCommunicationInput>>;
  decisions?: InputMaybe<Array<ProtocolDecisionInput>>;
  infoPoints?: InputMaybe<Array<Scalars['String']['input']>>;
  openPoints?: InputMaybe<Array<ProtocolOpenPointInput>>;
};

/** Lifecycle status of a meeting protocol */
export enum ProtocolStatus {
  Draft = 'DRAFT',
  Finalized = 'FINALIZED'
}

export type ProtocolTaskDraftInput = {
  assigneeMembershipIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<TaskPriority>;
  title: Scalars['String']['input'];
};

export type ProtocolTemplate = {
  __typename?: 'ProtocolTemplate';
  agendaItems: Array<AgendaItem>;
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<Membership>;
  createdByMembershipId?: Maybe<Scalars['ID']['output']>;
  defaultParticipantMembershipIds: Array<Scalars['ID']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  organization?: Maybe<Organization>;
  organizationId: Scalars['ID']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  usedCount: Scalars['Int']['output'];
  version: Scalars['Int']['output'];
};

export type PurgeCandidate = {
  __typename?: 'PurgeCandidate';
  action: RetentionAction;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  dueSince: Scalars['DateTime']['output'];
  entityType: RetentionEntityType;
  executedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  note?: Maybe<Scalars['String']['output']>;
  organizationId: Scalars['String']['output'];
  reviewedAt?: Maybe<Scalars['DateTime']['output']>;
  reviewedByMembershipId?: Maybe<Scalars['ID']['output']>;
  status: PurgeStatus;
  subjectId: Scalars['ID']['output'];
  subjectLabel: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

/** Lifecycle of a retention purge candidate */
export enum PurgeStatus {
  Approved = 'APPROVED',
  Executed = 'EXECUTED',
  Failed = 'FAILED',
  Pending = 'PENDING',
  Rejected = 'REJECTED'
}

export type Query = {
  __typename?: 'Query';
  accessReview: Array<AccessReviewEntry>;
  activeEnrollmentsBySchoolClassId: Array<SchoolClassEnrollment>;
  addressById: Address;
  addressesByOrgId: Array<Address>;
  admissionActivities: Array<AdmissionActivity>;
  admissionApplicationById: AdmissionApplication;
  admissionApplications: Array<AdmissionApplication>;
  admissionApplicationsByFamily: Array<AdmissionApplication>;
  admissionAppointmentTypes: Array<AdmissionAppointmentType>;
  admissionAppointmentsByApplication: Array<AdmissionAppointment>;
  admissionAuditLogs: Array<AdmissionAuditLog>;
  admissionBoardSettings: AdmissionBoardSettings;
  admissionDocumentsByApplication: Array<AdmissionDocument>;
  admissionEmails: Array<AdmissionEmail>;
  admissionRejectionReasons: Array<AdmissionRejectionReason>;
  admissionReminders: Array<AdmissionReminder>;
  admissionSourceById: AdmissionSource;
  admissionSources: Array<AdmissionSource>;
  admissionStageById: AdmissionStage;
  admissionStages: Array<AdmissionStage>;
  areaLessonCountsByOrg: Array<AreaLessonCount>;
  areasByOrg: Array<CurriculumNode>;
  authAccountsByUserEmailId: Array<AuthAccount>;
  authContext: AuthContextOutput;
  authUserIdByUserId?: Maybe<Scalars['String']['output']>;
  classroomAttentionSummaries: Array<StudentAttentionSummaryOutput>;
  classroomEngagementTimeline: EngagementTimelineOutput;
  classroomHeatmapData: ClassroomHeatmapDataOutput;
  companyVacations: Array<CompanyVacation>;
  consentAuditTrail: Array<ConsentAuditLog>;
  consentPurposeById: ConsentPurpose;
  consentPurposes: Array<ConsentPurpose>;
  consentsForSubject: Array<Consent>;
  contactPersonById: ContactPerson;
  contactPersonsByOrgId: Array<ContactPerson>;
  contactPersonsByStudentId: Array<StudentContactPerson>;
  contactPersonsSharingAddress: Array<ContactPerson>;
  countries: Array<Country>;
  country: Country;
  countryInputTemplate?: Maybe<CountryInputTemplate>;
  countryInputTemplates: Array<CountryInputTemplate>;
  currentLessonRecord?: Maybe<LessonRecord>;
  currentUser: User;
  curricula: Array<Curriculum>;
  curriculumById: Curriculum;
  curriculumLevelById: CurriculumLevel;
  curriculumLevels: Array<CurriculumLevel>;
  curriculumNodeById: CurriculumNode;
  curriculumNodes: Array<CurriculumNode>;
  dataBreachById: DataBreachIncident;
  dataBreaches: Array<DataBreachIncident>;
  dataSubjectExport: Scalars['String']['output'];
  dataSubjectRequestById: DataSubjectRequest;
  dataSubjectRequests: Array<DataSubjectRequest>;
  emailTemplates: Array<EmailTemplate>;
  employeeAbsenceCategoriesByOrgId: Array<EmployeeAbsenceCategory>;
  employeeAbsenceCategoryById: EmployeeAbsenceCategory;
  employeeAbsenceCategorySummary: Array<AbsenceCategorySummary>;
  employeeAuditLog: Array<EmployeeAuditLog>;
  employeeById: Employee;
  employeeContractById: EmployeeContract;
  employeeContractsByEmployeeId: Array<EmployeeContract>;
  employeeContractsByOrgId: Array<EmployeeContract>;
  employeeEmergencyProfile?: Maybe<EmployeeEmergencyProfile>;
  employeeHrProfile?: Maybe<EmployeeHrProfile>;
  employeeMissingRecordDays: Array<Scalars['String']['output']>;
  employeeMonthlyWorkTime: Array<MonthlyWorkTimeSummary>;
  employeeNotesByEmployeeId: Array<EmployeeNote>;
  employeePaidOvertime: Array<EmployeePaidOvertime>;
  employeePeriodOpeningBalances: Array<EmployeePeriodOpeningBalance>;
  employeeVacationBalance: VacationBalance;
  employeeVacations: Array<EmployeeVacation>;
  employeeWorkTimeBalance: WorkTimeBalance;
  employeesByOrgId: Array<Employee>;
  enrollmentsByStudentId: Array<SchoolClassEnrollment>;
  families: Array<Family>;
  familyById: Family;
  gradeLevelById: GradeLevel;
  gradeLevelsByOrgId: Array<GradeLevel>;
  holidays: Array<Holiday>;
  isOrganizationDomainAvailable: Scalars['Boolean']['output'];
  isOrganizationSubdomainAvailable: Scalars['Boolean']['output'];
  lessonPrerequisites: Array<CurriculumNode>;
  lessonRecord: LessonRecord;
  lessonRecords: Array<LessonRecord>;
  lessonsByOrg: Array<CurriculumNode>;
  membershipsByOrgId: Array<Membership>;
  myEmployeeId?: Maybe<Scalars['ID']['output']>;
  myMissingRecordDays: Array<Scalars['String']['output']>;
  myProjects: Array<Project>;
  myTasks: Array<Task>;
  myTeachingSchoolClasses: Array<SchoolClass>;
  myTeams: Array<AccessibleTeam>;
  myVacationBalance: VacationBalance;
  myWorkTimeBalance: WorkTimeBalance;
  nextLessonsForStudent: Array<CurriculumNode>;
  orgAdmissionReminders: Array<AdmissionReminder>;
  organization: Organization;
  organizationSetting: OrganizationSettingOutput;
  organizationSettings: Array<OrganizationSettingOutput>;
  organizations: Array<Organization>;
  permissions: Array<Permission>;
  previewAdmissionEmail: AdmissionEmailPreview;
  processingActivities: Array<ProcessingActivity>;
  projectById: Project;
  projectMembers: Array<ProjectMember>;
  projectTemplateById: ProjectTemplate;
  projectTemplates: Array<ProjectTemplate>;
  protocolById: Protocol;
  protocolTemplatesByOrg: Array<ProtocolTemplate>;
  protocolsByOrg: Array<Protocol>;
  purgeCandidates: Array<PurgeCandidate>;
  recordKeepingSettings: RecordKeepingSettings;
  relatedAddressesForContactPerson: Array<AddressSuggestion>;
  retentionPolicies: Array<RetentionPolicy>;
  rolesByOrgId: Array<Role>;
  rolesByOrganizationId: Array<Role>;
  schoolClassById: SchoolClass;
  schoolClassesByOrgId: Array<SchoolClass>;
  studentById: Student;
  studentLessonRecordTimeline: StudentTimelineOutput;
  studentNotesByStudentId: Array<StudentNote>;
  studentsByContactPersonId: Array<StudentContactPerson>;
  studentsByOrgId: Array<Student>;
  subprocessors: Array<Subprocessor>;
  taskById: Task;
  tasksByProject: Array<Task>;
  tasksByProtocol: Array<Task>;
  teachersByOrgId: Array<Employee>;
  teamById: Team;
  teamMemberById: TeamMember;
  teamMembersByOrgId: Array<TeamMember>;
  teamMembersByTeamId: Array<TeamMember>;
  teamWorkTimeOverview: Array<EmployeeWorkTimeOverviewRow>;
  teamsByOrgId: Array<Team>;
  timeTrackingByEmployeeId: Array<TimeTracking>;
  timeTrackingById: TimeTracking;
  timeTrackingPeriods: Array<TimeTrackingPeriod>;
  unassignedStudents: Array<Student>;
  user: User;
  userEmail: UserEmail;
  userEmailsByUserId: Array<UserEmail>;
  users: Array<User>;
};


export type QueryActiveEnrollmentsBySchoolClassIdArgs = {
  schoolClassId: Scalars['ID']['input'];
};


export type QueryAddressByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAdmissionActivitiesArgs = {
  applicationId: Scalars['ID']['input'];
};


export type QueryAdmissionApplicationByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAdmissionApplicationsArgs = {
  includeFinished?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryAdmissionApplicationsByFamilyArgs = {
  familyId: Scalars['ID']['input'];
};


export type QueryAdmissionAppointmentTypesArgs = {
  includeArchived?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryAdmissionAppointmentsByApplicationArgs = {
  applicationId: Scalars['ID']['input'];
};


export type QueryAdmissionAuditLogsArgs = {
  applicationId: Scalars['ID']['input'];
};


export type QueryAdmissionDocumentsByApplicationArgs = {
  applicationId: Scalars['ID']['input'];
};


export type QueryAdmissionEmailsArgs = {
  applicationId: Scalars['ID']['input'];
};


export type QueryAdmissionRejectionReasonsArgs = {
  includeArchived?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryAdmissionRemindersArgs = {
  applicationId: Scalars['ID']['input'];
};


export type QueryAdmissionSourceByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAdmissionSourcesArgs = {
  includeArchived?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryAdmissionStageByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAdmissionStagesArgs = {
  includeArchived?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryAreasByOrgArgs = {
  includeArchived?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryAuthAccountsByUserEmailIdArgs = {
  userEmailId: Scalars['ID']['input'];
};


export type QueryAuthUserIdByUserIdArgs = {
  userId: Scalars['ID']['input'];
};


export type QueryClassroomAttentionSummariesArgs = {
  locale?: Scalars['String']['input'];
  schoolClassId: Scalars['ID']['input'];
};


export type QueryClassroomEngagementTimelineArgs = {
  from: Scalars['String']['input'];
  granularity?: TimelineGranularity;
  schoolClassId: Scalars['ID']['input'];
  to: Scalars['String']['input'];
};


export type QueryClassroomHeatmapDataArgs = {
  locale?: Scalars['String']['input'];
  schoolClassId: Scalars['ID']['input'];
};


export type QueryConsentAuditTrailArgs = {
  subjectId: Scalars['ID']['input'];
  subjectType: ConsentSubjectType;
};


export type QueryConsentPurposeByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryConsentPurposesArgs = {
  includeArchived?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryConsentsForSubjectArgs = {
  subjectId: Scalars['ID']['input'];
  subjectType: ConsentSubjectType;
};


export type QueryContactPersonByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryContactPersonsByStudentIdArgs = {
  studentId: Scalars['ID']['input'];
};


export type QueryContactPersonsSharingAddressArgs = {
  addressId: Scalars['ID']['input'];
  excludeContactPersonId: Scalars['ID']['input'];
};


export type QueryCountryArgs = {
  id: Scalars['Int']['input'];
};


export type QueryCountryInputTemplateArgs = {
  countryCode: Scalars['String']['input'];
  fieldType: CountryInputFieldType;
};


export type QueryCurrentLessonRecordArgs = {
  lessonId: Scalars['ID']['input'];
  studentId: Scalars['ID']['input'];
};


export type QueryCurriculaArgs = {
  includeArchived?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryCurriculumByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryCurriculumLevelByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryCurriculumLevelsArgs = {
  curriculumId: Scalars['ID']['input'];
  includeArchived?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryCurriculumNodeByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryCurriculumNodesArgs = {
  curriculumId: Scalars['ID']['input'];
  includeArchived?: InputMaybe<Scalars['Boolean']['input']>;
  levelId: Scalars['ID']['input'];
};


export type QueryDataBreachByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryDataBreachesArgs = {
  status?: InputMaybe<DataBreachStatus>;
};


export type QueryDataSubjectExportArgs = {
  subjectId: Scalars['ID']['input'];
  subjectType: DataSubjectType;
};


export type QueryDataSubjectRequestByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryDataSubjectRequestsArgs = {
  status?: InputMaybe<DataSubjectRequestStatus>;
};


export type QueryEmailTemplatesArgs = {
  category?: InputMaybe<EmailTemplateCategory>;
};


export type QueryEmployeeAbsenceCategoryByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryEmployeeAbsenceCategorySummaryArgs = {
  employeeId: Scalars['ID']['input'];
  from: Scalars['String']['input'];
  locale?: InputMaybe<Scalars['String']['input']>;
  to: Scalars['String']['input'];
};


export type QueryEmployeeAuditLogArgs = {
  employeeId: Scalars['ID']['input'];
};


export type QueryEmployeeByIdArgs = {
  employeeId: Scalars['ID']['input'];
};


export type QueryEmployeeContractByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryEmployeeContractsByEmployeeIdArgs = {
  employeeId: Scalars['ID']['input'];
};


export type QueryEmployeeEmergencyProfileArgs = {
  employeeId: Scalars['ID']['input'];
};


export type QueryEmployeeHrProfileArgs = {
  employeeId: Scalars['ID']['input'];
};


export type QueryEmployeeMissingRecordDaysArgs = {
  employeeId: Scalars['ID']['input'];
  from: Scalars['String']['input'];
  to: Scalars['String']['input'];
};


export type QueryEmployeeMonthlyWorkTimeArgs = {
  employeeId: Scalars['ID']['input'];
  from: Scalars['String']['input'];
  to: Scalars['String']['input'];
};


export type QueryEmployeeNotesByEmployeeIdArgs = {
  employeeId: Scalars['ID']['input'];
};


export type QueryEmployeePaidOvertimeArgs = {
  employeeId: Scalars['ID']['input'];
};


export type QueryEmployeePeriodOpeningBalancesArgs = {
  employeeId: Scalars['ID']['input'];
};


export type QueryEmployeeVacationBalanceArgs = {
  employeeId: Scalars['ID']['input'];
  from: Scalars['String']['input'];
  to: Scalars['String']['input'];
};


export type QueryEmployeeVacationsArgs = {
  employeeId: Scalars['ID']['input'];
};


export type QueryEmployeeWorkTimeBalanceArgs = {
  employeeId: Scalars['ID']['input'];
  from: Scalars['String']['input'];
  to: Scalars['String']['input'];
};


export type QueryEnrollmentsByStudentIdArgs = {
  studentId: Scalars['ID']['input'];
};


export type QueryFamiliesArgs = {
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryFamilyByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGradeLevelByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryIsOrganizationDomainAvailableArgs = {
  domain: Scalars['String']['input'];
};


export type QueryIsOrganizationSubdomainAvailableArgs = {
  subdomain: Scalars['String']['input'];
};


export type QueryLessonPrerequisitesArgs = {
  lessonId: Scalars['ID']['input'];
};


export type QueryLessonRecordArgs = {
  id: Scalars['ID']['input'];
};


export type QueryLessonRecordsArgs = {
  filter?: InputMaybe<LessonRecordsFilterInput>;
};


export type QueryLessonsByOrgArgs = {
  includeArchived?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryMembershipsByOrgIdArgs = {
  organizationId: Scalars['ID']['input'];
};


export type QueryMyMissingRecordDaysArgs = {
  from: Scalars['String']['input'];
  to: Scalars['String']['input'];
};


export type QueryMyVacationBalanceArgs = {
  from: Scalars['String']['input'];
  to: Scalars['String']['input'];
};


export type QueryMyWorkTimeBalanceArgs = {
  from: Scalars['String']['input'];
  to: Scalars['String']['input'];
};


export type QueryNextLessonsForStudentArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  studentId: Scalars['ID']['input'];
};


export type QueryOrgAdmissionRemindersArgs = {
  filter?: InputMaybe<AdmissionReminderFilter>;
};


export type QueryOrganizationArgs = {
  id: Scalars['String']['input'];
};


export type QueryOrganizationSettingArgs = {
  decrypt?: Scalars['Boolean']['input'];
  key: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
};


export type QueryOrganizationSettingsArgs = {
  organizationId: Scalars['ID']['input'];
};


export type QueryPreviewAdmissionEmailArgs = {
  applicationId: Scalars['ID']['input'];
  templateId: Scalars['ID']['input'];
};


export type QueryProjectByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryProjectMembersArgs = {
  projectId: Scalars['ID']['input'];
};


export type QueryProjectTemplateByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryProtocolByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPurgeCandidatesArgs = {
  status?: InputMaybe<PurgeStatus>;
};


export type QueryRelatedAddressesForContactPersonArgs = {
  contactPersonId: Scalars['ID']['input'];
};


export type QueryRolesByOrganizationIdArgs = {
  organizationId: Scalars['ID']['input'];
};


export type QuerySchoolClassByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryStudentByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryStudentLessonRecordTimelineArgs = {
  from: Scalars['String']['input'];
  granularity?: TimelineGranularity;
  studentId: Scalars['ID']['input'];
  to: Scalars['String']['input'];
};


export type QueryStudentNotesByStudentIdArgs = {
  studentId: Scalars['ID']['input'];
};


export type QueryStudentsByContactPersonIdArgs = {
  contactPersonId: Scalars['ID']['input'];
};


export type QueryTaskByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTasksByProjectArgs = {
  projectId: Scalars['ID']['input'];
};


export type QueryTasksByProtocolArgs = {
  protocolId: Scalars['ID']['input'];
};


export type QueryTeamByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTeamMemberByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTeamMembersByTeamIdArgs = {
  teamId: Scalars['ID']['input'];
};


export type QueryTeamWorkTimeOverviewArgs = {
  from: Scalars['String']['input'];
  to: Scalars['String']['input'];
};


export type QueryTimeTrackingByEmployeeIdArgs = {
  employeeId: Scalars['ID']['input'];
  from?: InputMaybe<Scalars['String']['input']>;
  to?: InputMaybe<Scalars['String']['input']>;
};


export type QueryTimeTrackingByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUserEmailArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUserEmailsByUserIdArgs = {
  userId: Scalars['ID']['input'];
};

export type RecordConsentInput = {
  decidedAt?: InputMaybe<Scalars['DateTime']['input']>;
  evidenceUrl?: InputMaybe<Scalars['String']['input']>;
  grantedByContactPersonId?: InputMaybe<Scalars['ID']['input']>;
  note?: InputMaybe<Scalars['String']['input']>;
  purposeId: Scalars['ID']['input'];
  status: ConsentStatus;
  subjectId: Scalars['ID']['input'];
  subjectType: ConsentSubjectType;
};

export type RecordKeepingSettings = {
  __typename?: 'RecordKeepingSettings';
  bigGapDays: Scalars['Int']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  introducedStuckDays: Scalars['Int']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  organizationId: Scalars['String']['output'];
  practicedStuckDays: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type RejectAdmissionApplicationInput = {
  followUpYear?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
  rejectedBy?: InputMaybe<AdmissionRejectedBy>;
  rejectionReasonId?: InputMaybe<Scalars['ID']['input']>;
};

/** Relationship of a contact person to a student (parent, guardian, sibling, etc.) */
export enum RelationshipType {
  AuntUncle = 'AUNT_UNCLE',
  Father = 'FATHER',
  Grandfather = 'GRANDFATHER',
  Grandmother = 'GRANDMOTHER',
  LegalGuardian = 'LEGAL_GUARDIAN',
  Mother = 'MOTHER',
  Nanny = 'NANNY',
  Other = 'OTHER',
  Sibling = 'SIBLING',
  StepFather = 'STEP_FATHER',
  StepMother = 'STEP_MOTHER'
}

export type ReorderAdmissionApplicationsInput = {
  applicationIds: Array<Scalars['ID']['input']>;
  stageId: Scalars['ID']['input'];
};

export type ReorderAdmissionAppointmentTypesInput = {
  ids: Array<Scalars['ID']['input']>;
};

export type ReorderAdmissionRejectionReasonsInput = {
  ids: Array<Scalars['ID']['input']>;
};

export type ReorderAdmissionSourcesInput = {
  ids: Array<Scalars['ID']['input']>;
};

export type ReorderAdmissionStagesInput = {
  ids: Array<Scalars['ID']['input']>;
};

export type ReorderConsentPurposesInput = {
  ids: Array<Scalars['ID']['input']>;
};

export type ReorderCurriculumNodesInput = {
  curriculumId: Scalars['ID']['input'];
  ids: Array<Scalars['ID']['input']>;
  levelId: Scalars['ID']['input'];
  parentId?: InputMaybe<Scalars['ID']['input']>;
};

export type ReorderGradeLevelsInput = {
  ids: Array<Scalars['ID']['input']>;
  parentId?: InputMaybe<Scalars['ID']['input']>;
};

export type ReorderSchoolClassesInput = {
  ids: Array<Scalars['ID']['input']>;
};

export type ReorderTeamsInput = {
  ids: Array<Scalars['ID']['input']>;
  parentId?: InputMaybe<Scalars['ID']['input']>;
};

/** Action taken when the retention period lapses */
export enum RetentionAction {
  Anonymize = 'ANONYMIZE',
  Delete = 'DELETE'
}

/** The kind of record a retention policy governs */
export enum RetentionEntityType {
  AdmissionApplication = 'ADMISSION_APPLICATION',
  ContactPerson = 'CONTACT_PERSON',
  DataSubjectRequest = 'DATA_SUBJECT_REQUEST',
  Employee = 'EMPLOYEE',
  Student = 'STUDENT'
}

export type RetentionPolicy = {
  __typename?: 'RetentionPolicy';
  action: RetentionAction;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  dueCount?: Maybe<Scalars['Int']['output']>;
  entityType: RetentionEntityType;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  isEnabled: Scalars['Boolean']['output'];
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  retentionMonths: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type Role = {
  __typename?: 'Role';
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  isSystem: Scalars['Boolean']['output'];
  memberships?: Maybe<Array<Membership>>;
  name?: Maybe<Scalars['String']['output']>;
  organization: Organization;
  organizationId: Scalars['ID']['output'];
  permissions?: Maybe<Array<Permission>>;
  systemCode?: Maybe<SystemRole>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

/** Stimmung im Raum: CALM / FOCUSED / RESTLESS / DIFFICULT. */
export enum RoomMood {
  Calm = 'CALM',
  Difficult = 'DIFFICULT',
  Focused = 'FOCUSED',
  Restless = 'RESTLESS'
}

/** Form of address for a contact person */
export enum Salutation {
  Diverse = 'DIVERSE',
  Mr = 'MR',
  Mrs = 'MRS',
  None = 'NONE'
}

export type SaveProjectAsTemplateInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  projectId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};

export type SaveProtocolAsTemplateInput = {
  protocolId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};

export type SchoolClass = {
  __typename?: 'SchoolClass';
  color?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  enrolledCount?: Maybe<Scalars['Int']['output']>;
  gradeLevels?: Maybe<Array<GradeLevel>>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  maxCapacity?: Maybe<Scalars['Int']['output']>;
  name: Scalars['String']['output'];
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  room?: Maybe<Scalars['String']['output']>;
  sortOrder: Scalars['Int']['output'];
  teachers?: Maybe<Array<Employee>>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type SchoolClassEnrollment = {
  __typename?: 'SchoolClassEnrollment';
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  enrolledAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  leftAt?: Maybe<Scalars['String']['output']>;
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  schoolClass: SchoolClass;
  schoolClassId: Scalars['String']['output'];
  student: Student;
  studentId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type SendAdmissionEmailInput = {
  applicationId: Scalars['ID']['input'];
  bodyHtml: Scalars['String']['input'];
  subject: Scalars['String']['input'];
  templateId?: InputMaybe<Scalars['ID']['input']>;
  toEmail: Scalars['String']['input'];
  toName?: InputMaybe<Scalars['String']['input']>;
};

export type SetLessonPrerequisitesInput = {
  lessonId: Scalars['ID']['input'];
  prerequisiteIds: Array<Scalars['ID']['input']>;
};

export type Student = {
  __typename?: 'Student';
  admissionApplicationId?: Maybe<Scalars['ID']['output']>;
  admissionStage?: Maybe<AdmissionStage>;
  admissionStageId?: Maybe<Scalars['ID']['output']>;
  createdAt: Scalars['DateTime']['output'];
  currentClass?: Maybe<SchoolClass>;
  dateOfBirth?: Maybe<Scalars['String']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  enrollmentDate?: Maybe<Scalars['String']['output']>;
  exitDate?: Maybe<Scalars['String']['output']>;
  firstName: Scalars['String']['output'];
  gender?: Maybe<Gender>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  lastName: Scalars['String']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type StudentAttentionSummaryOutput = {
  __typename?: 'StudentAttentionSummaryOutput';
  byReason: AttentionReasonCounts;
  firstName: Scalars['String']['output'];
  lastName: Scalars['String']['output'];
  studentId: Scalars['String']['output'];
  topItems: Array<AttentionItemOutput>;
  totalSignals: Scalars['Int']['output'];
};

export type StudentContactPerson = {
  __typename?: 'StudentContactPerson';
  contactPerson: ContactPerson;
  contactPersonId: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  emergencyPriority?: Maybe<Scalars['Int']['output']>;
  hasCustody: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  isPickupAuthorized: Scalars['Boolean']['output'];
  isPrimaryContact: Scalars['Boolean']['output'];
  livesWithStudent: Scalars['Boolean']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  relationshipType: RelationshipType;
  student: Student;
  studentId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type StudentNote = {
  __typename?: 'StudentNote';
  authorMembership?: Maybe<Membership>;
  authorMembershipId?: Maybe<Scalars['ID']['output']>;
  category: StudentNoteCategory;
  content: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  date: Scalars['String']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  isConfidential: Scalars['Boolean']['output'];
  organizationId: Scalars['ID']['output'];
  student: Student;
  studentId: Scalars['ID']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

/** Category of a student note */
export enum StudentNoteCategory {
  Academic = 'ACADEMIC',
  Behavior = 'BEHAVIOR',
  General = 'GENERAL',
  Health = 'HEALTH',
  Meeting = 'MEETING',
  Other = 'OTHER',
  ParentContact = 'PARENT_CONTACT'
}

export type StudentTimelineBucketOutput = {
  __typename?: 'StudentTimelineBucketOutput';
  bucketStart: Scalars['String']['output'];
  introduced: Scalars['Int']['output'];
  mastered: Scalars['Int']['output'];
  needsMore: Scalars['Int']['output'];
  planning: Scalars['Int']['output'];
  practiced: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type StudentTimelineOutput = {
  __typename?: 'StudentTimelineOutput';
  buckets: Array<StudentTimelineBucketOutput>;
  daysSinceLastIntroduction?: Maybe<Scalars['Int']['output']>;
  totalIntroductionsInRange: Scalars['Int']['output'];
};

export type Subprocessor = {
  __typename?: 'Subprocessor';
  country?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  dpaSigned: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  purpose?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  url?: Maybe<Scalars['String']['output']>;
  version: Scalars['Int']['output'];
};

/** Supported System Employee Absence Category */
export enum SystemEmployeeAbsenceCategory {
  Accident = 'ACCIDENT',
  ChildcareSick = 'CHILDCARE_SICK',
  CivilService = 'CIVIL_SERVICE',
  Funeral = 'FUNERAL',
  MilitaryService = 'MILITARY_SERVICE',
  Move = 'MOVE',
  Other = 'OTHER',
  Sickness = 'SICKNESS',
  Training = 'TRAINING'
}

/** Supported System Roles */
export enum SystemRole {
  Employee = 'EMPLOYEE',
  HrManager = 'HR_MANAGER',
  Office = 'OFFICE',
  OrgAdmin = 'ORG_ADMIN',
  OrgOwner = 'ORG_OWNER',
  TeamLead = 'TEAM_LEAD'
}

export type Task = {
  __typename?: 'Task';
  admissionApplication?: Maybe<AdmissionApplication>;
  admissionApplicationId?: Maybe<Scalars['ID']['output']>;
  admissionReminder?: Maybe<AdmissionReminder>;
  admissionReminderId?: Maybe<Scalars['ID']['output']>;
  assignees?: Maybe<Array<TaskAssignee>>;
  checklist: Array<TaskChecklistItem>;
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<Membership>;
  createdByMembershipId?: Maybe<Scalars['ID']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  dueDate?: Maybe<Scalars['String']['output']>;
  dueTime?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  notes: Array<TaskNote>;
  organization?: Maybe<Organization>;
  organizationId: Scalars['ID']['output'];
  priority: TaskPriority;
  project?: Maybe<Project>;
  projectId?: Maybe<Scalars['ID']['output']>;
  protocol?: Maybe<Protocol>;
  protocolId?: Maybe<Scalars['ID']['output']>;
  sortOrder: Scalars['Int']['output'];
  status: TaskStatus;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type TaskAssignee = {
  __typename?: 'TaskAssignee';
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  membership?: Maybe<Membership>;
  membershipId: Scalars['ID']['output'];
  organization?: Maybe<Organization>;
  organizationId: Scalars['ID']['output'];
  sortOrder: Scalars['Int']['output'];
  task?: Maybe<Task>;
  taskId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type TaskChecklistItem = {
  __typename?: 'TaskChecklistItem';
  done: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
};

export type TaskChecklistItemInput = {
  done: Scalars['Boolean']['input'];
  id?: InputMaybe<Scalars['String']['input']>;
  label: Scalars['String']['input'];
};

export type TaskNote = {
  __typename?: 'TaskNote';
  authorMembershipId?: Maybe<Scalars['String']['output']>;
  authorName?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  id: Scalars['String']['output'];
  text: Scalars['String']['output'];
};

/** Priority of a task */
export enum TaskPriority {
  High = 'HIGH',
  Low = 'LOW',
  Medium = 'MEDIUM',
  Urgent = 'URGENT'
}

/** Workflow status of a task; also the columns of the board */
export enum TaskStatus {
  Blocked = 'BLOCKED',
  Done = 'DONE',
  InProgress = 'IN_PROGRESS',
  Open = 'OPEN'
}

/** LK-Selbsteinschätzung der Vorbereitung: WELL_PREPARED / ACCEPTABLE / RUSHED. */
export enum TeacherPreparation {
  Acceptable = 'ACCEPTABLE',
  Rushed = 'RUSHED',
  WellPrepared = 'WELL_PREPARED'
}

/** LK-Stresslevel: RELAXED / NORMAL / STRESSED. */
export enum TeacherStressLevel {
  Normal = 'NORMAL',
  Relaxed = 'RELAXED',
  Stressed = 'STRESSED'
}

export type Team = {
  __typename?: 'Team';
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  parentId?: Maybe<Scalars['ID']['output']>;
  sortOrder: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type TeamMember = {
  __typename?: 'TeamMember';
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  employee?: Maybe<Employee>;
  employeeId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  role: TeamMemberRole;
  team?: Maybe<Team>;
  teamId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

/** Role of an employee within a team (MEMBER or LEAD) */
export enum TeamMemberRole {
  Lead = 'LEAD',
  Member = 'MEMBER'
}

export type TemplateTaskInput = {
  defaultAssigneeRole?: InputMaybe<SystemRole>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueOffsetDays?: InputMaybe<Scalars['Int']['input']>;
  priority?: InputMaybe<TaskPriority>;
  title: Scalars['String']['input'];
};

export type TimeTracking = {
  __typename?: 'TimeTracking';
  breakMinutes?: Maybe<Scalars['Int']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  employee?: Maybe<Employee>;
  employeeId: Scalars['String']['output'];
  endedAt?: Maybe<Scalars['DateTime']['output']>;
  entryDate: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  source: TimeTrackingSource;
  startedAt: Scalars['DateTime']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
  workMinutes?: Maybe<Scalars['Int']['output']>;
};

export type TimeTrackingPeriod = {
  __typename?: 'TimeTrackingPeriod';
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  endDate: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  organizationId: Scalars['ID']['output'];
  startDate: Scalars['String']['output'];
  status: TimeTrackingPeriodStatus;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export enum TimeTrackingPeriodStatus {
  Locked = 'LOCKED',
  Open = 'OPEN'
}

export enum TimeTrackingSource {
  Clock = 'CLOCK',
  Manual = 'MANUAL'
}

export type TimeWindow = {
  __typename?: 'TimeWindow';
  end: Scalars['String']['output'];
  start: Scalars['String']['output'];
};

export type TimeWindowInput = {
  end: Scalars['String']['input'];
  start: Scalars['String']['input'];
};

/** Bucketing granularity for timeline aggregates. */
export enum TimelineGranularity {
  Day = 'DAY',
  Month = 'MONTH',
  Week = 'WEEK'
}

export type TransferStudentInput = {
  studentId: Scalars['ID']['input'];
  targetSchoolClassId?: InputMaybe<Scalars['ID']['input']>;
  transferDate?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateAddressInput = {
  addressLine2?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  countryId?: InputMaybe<Scalars['ID']['input']>;
  houseNumber?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  postalCode?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
  street?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateAdmissionActivityInput = {
  body?: InputMaybe<Scalars['String']['input']>;
  direction?: InputMaybe<AdmissionActivityDirection>;
  durationMinutes?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['ID']['input'];
  location?: InputMaybe<Scalars['String']['input']>;
  occurredAt?: InputMaybe<Scalars['String']['input']>;
  subject?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<AdmissionActivityType>;
};

export type UpdateAdmissionApplicationInput = {
  admissionSourceId?: InputMaybe<Scalars['ID']['input']>;
  assignedGradeLevelId?: InputMaybe<Scalars['ID']['input']>;
  childDateOfBirth?: InputMaybe<Scalars['String']['input']>;
  childFirstName?: InputMaybe<Scalars['String']['input']>;
  childGender?: InputMaybe<Gender>;
  childLastName?: InputMaybe<Scalars['String']['input']>;
  childNotes?: InputMaybe<Scalars['String']['input']>;
  desiredEnrollmentDate?: InputMaybe<Scalars['String']['input']>;
  desiredSchoolClassId?: InputMaybe<Scalars['ID']['input']>;
  id: Scalars['ID']['input'];
};

export type UpdateAdmissionAppointmentInput = {
  applicationId?: InputMaybe<Scalars['ID']['input']>;
  appointmentTypeId?: InputMaybe<Scalars['ID']['input']>;
  assignedToMembershipIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  durationMinutes?: InputMaybe<Scalars['Int']['input']>;
  endsAt?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  location?: InputMaybe<Scalars['String']['input']>;
  note?: InputMaybe<Scalars['String']['input']>;
  scheduledAt?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<AdmissionAppointmentStatus>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateAdmissionAppointmentTypeInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  label?: InputMaybe<Scalars['String']['input']>;
  position?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateAdmissionBoardSettingsInput = {
  tableColumns: Array<Scalars['String']['input']>;
};

export type UpdateAdmissionRejectionReasonInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  label?: InputMaybe<Scalars['String']['input']>;
  position?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateAdmissionReminderInput = {
  assignedToMembershipId?: InputMaybe<Scalars['ID']['input']>;
  dueAt?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateAdmissionSourceInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  position?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateAdmissionStageInput = {
  cardFields?: InputMaybe<Array<Scalars['String']['input']>>;
  color?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  position?: InputMaybe<Scalars['Int']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  stageType?: InputMaybe<AdmissionStageType>;
};

export type UpdateCompanyVacationInput = {
  appliesToAll?: InputMaybe<Scalars['Boolean']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateConsentPurposeInput = {
  appliesTo?: InputMaybe<Array<ConsentSubjectType>>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  isMandatory?: InputMaybe<Scalars['Boolean']['input']>;
  legalBasis?: InputMaybe<ConsentLegalBasis>;
  name?: InputMaybe<Scalars['String']['input']>;
  position?: InputMaybe<Scalars['Int']['input']>;
  requiresEvidence?: InputMaybe<Scalars['Boolean']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateContactPersonInput = {
  addressId?: InputMaybe<Scalars['ID']['input']>;
  dateOfBirth?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  familyId?: InputMaybe<Scalars['ID']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  lastName?: InputMaybe<Scalars['String']['input']>;
  middleName?: InputMaybe<Scalars['String']['input']>;
  mobile?: InputMaybe<Scalars['String']['input']>;
  nationalities?: InputMaybe<Array<Scalars['String']['input']>>;
  notes?: InputMaybe<Scalars['String']['input']>;
  occupation?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  preferredLanguages?: InputMaybe<Array<Scalars['String']['input']>>;
  roles?: InputMaybe<Array<RelationshipType>>;
  salutation?: InputMaybe<Salutation>;
  socialSecurityNumber?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateCountryInput = {
  /** Example field (placeholder) */
  exampleField?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['Int']['input'];
};

export type UpdateCurriculumInput = {
  id: Scalars['ID']['input'];
  position?: InputMaybe<Scalars['Int']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  translations?: InputMaybe<Array<CurriculumTranslationInput>>;
};

export type UpdateCurriculumLevelInput = {
  curriculumId?: InputMaybe<Scalars['ID']['input']>;
  id: Scalars['ID']['input'];
  position?: InputMaybe<Scalars['Int']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  translations?: InputMaybe<Array<CurriculumLevelTranslationInput>>;
};

export type UpdateCurriculumNodeInput = {
  id: Scalars['ID']['input'];
  lessonScale?: InputMaybe<LessonScale>;
  lessonType?: InputMaybe<LessonType>;
  levelId?: InputMaybe<Scalars['ID']['input']>;
  nodeType?: InputMaybe<CurriculumNodeType>;
  parentId?: InputMaybe<Scalars['ID']['input']>;
  position?: InputMaybe<Scalars['Int']['input']>;
  translations?: InputMaybe<Array<CurriculumNodeTranslationInput>>;
};

export type UpdateDataBreachInput = {
  affectedCount?: InputMaybe<Scalars['Int']['input']>;
  affectedScope?: InputMaybe<Scalars['String']['input']>;
  assigneeMembershipId?: InputMaybe<Scalars['ID']['input']>;
  authorityNotified?: InputMaybe<Scalars['Boolean']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  detectedAt?: InputMaybe<Scalars['DateTime']['input']>;
  id: Scalars['ID']['input'];
  measures?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  riskLevel?: InputMaybe<DataBreachRiskLevel>;
  status?: InputMaybe<DataBreachStatus>;
  subjectsNotified?: InputMaybe<Scalars['Boolean']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateDataSubjectRequestInput = {
  assigneeMembershipId?: InputMaybe<Scalars['ID']['input']>;
  contactEmail?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  receivedAt?: InputMaybe<Scalars['DateTime']['input']>;
  resolutionNote?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<DataSubjectRequestStatus>;
  subjectId?: InputMaybe<Scalars['ID']['input']>;
  subjectName?: InputMaybe<Scalars['String']['input']>;
  subjectType?: InputMaybe<DataSubjectType>;
  type?: InputMaybe<DataSubjectRequestType>;
};

export type UpdateEmailTemplateInput = {
  bodyHtml?: InputMaybe<Scalars['String']['input']>;
  category?: InputMaybe<EmailTemplateCategory>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  isAutomatic?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  subject?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateEmployeeAbsenceCategoryInput = {
  affectsVacationBalance?: InputMaybe<Scalars['Boolean']['input']>;
  certificateRequiredFromDay?: InputMaybe<Scalars['Int']['input']>;
  color?: InputMaybe<Scalars['String']['input']>;
  countsAsWorkTime?: InputMaybe<Scalars['Boolean']['input']>;
  defaultIsVacationCapable?: InputMaybe<Scalars['Boolean']['input']>;
  defaultPercentage?: InputMaybe<Scalars['Int']['input']>;
  iconName?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  isPaid?: InputMaybe<Scalars['Boolean']['input']>;
  maxDaysPerYear?: InputMaybe<Scalars['Int']['input']>;
  reducesVacationEntitlementAfterDays?: InputMaybe<Scalars['Int']['input']>;
  requiresApproval?: InputMaybe<Scalars['Boolean']['input']>;
  requiresCertificate?: InputMaybe<Scalars['Boolean']['input']>;
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
  translations?: InputMaybe<Array<EmployeeAbsenceCategoryTranslationInput>>;
};

export type UpdateEmployeeAbsenceInput = {
  absenceCategoryId?: InputMaybe<Scalars['ID']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  isTeamInformed?: InputMaybe<Scalars['Boolean']['input']>;
  isVacationCapable?: InputMaybe<Scalars['Boolean']['input']>;
  note?: InputMaybe<Scalars['String']['input']>;
  percentage?: InputMaybe<Scalars['Int']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateEmployeeContractInput = {
  annualVacationDays?: InputMaybe<Scalars['Int']['input']>;
  contractType?: InputMaybe<EmployeeContractType>;
  documentUrl?: InputMaybe<Scalars['String']['input']>;
  employeeId?: InputMaybe<Scalars['ID']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  grossSalary?: InputMaybe<Scalars['Float']['input']>;
  has13thSalary?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  paymentInterval?: InputMaybe<EmployeePaymentInterval>;
  position?: InputMaybe<Scalars['String']['input']>;
  probationEndDate?: InputMaybe<Scalars['String']['input']>;
  remainingVacationDays?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  supervisorMembershipId?: InputMaybe<Scalars['ID']['input']>;
  weekdayTimeWindows?: InputMaybe<WeekdayTimeWindowsInput>;
  weeklyHours?: InputMaybe<Scalars['String']['input']>;
  workloadPercent?: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateEmployeeInput = {
  addressLine2?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  contactPhone?: InputMaybe<Scalars['String']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  dateOfBirth?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  houseNumber?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  lastName?: InputMaybe<Scalars['String']['input']>;
  persona?: InputMaybe<Persona>;
  postalCode?: InputMaybe<Scalars['String']['input']>;
  socialSecurityNumber?: InputMaybe<Scalars['String']['input']>;
  street?: InputMaybe<Scalars['String']['input']>;
  timeTrackingEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateEmployeeNoteInput = {
  category?: InputMaybe<EmployeeNoteCategory>;
  content?: InputMaybe<Scalars['String']['input']>;
  date?: InputMaybe<Scalars['String']['input']>;
  employeeId?: InputMaybe<Scalars['ID']['input']>;
  id: Scalars['ID']['input'];
  isConfidential?: InputMaybe<Scalars['Boolean']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateEmployeePaidOvertimeInput = {
  date?: InputMaybe<Scalars['String']['input']>;
  employeeId?: InputMaybe<Scalars['ID']['input']>;
  id: Scalars['ID']['input'];
  minutes?: InputMaybe<Scalars['Int']['input']>;
  note?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateEmployeeVacationInput = {
  employeeId?: InputMaybe<Scalars['ID']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateFamilyInput = {
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  primaryAddressId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateGradeLevelInput = {
  ageMax?: InputMaybe<Scalars['Int']['input']>;
  ageMin?: InputMaybe<Scalars['Int']['input']>;
  color?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  parentId?: InputMaybe<Scalars['ID']['input']>;
  shortCode?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateHolidayInput = {
  canton?: InputMaybe<Scalars['String']['input']>;
  date?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  paidPercentage?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateLessonRecordInput = {
  id: Scalars['ID']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
  observation?: InputMaybe<LessonRecordObservationInput>;
  recordedAt?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<LessonRecordStatus>;
};

export type UpdateMembershipInput = {
  contactPhone?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  persona?: InputMaybe<Persona>;
  userEmailId?: InputMaybe<Scalars['ID']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateMyThemeInput = {
  theme: Scalars['String']['input'];
};

export type UpdateOrganizationInput = {
  bvgContactPhone?: InputMaybe<Scalars['String']['input']>;
  bvgProvider?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  dailySicknessContactPhone?: InputMaybe<Scalars['String']['input']>;
  dailySicknessProvider?: InputMaybe<Scalars['String']['input']>;
  domain?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isArchived?: InputMaybe<Scalars['Boolean']['input']>;
  isDeleted?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  organizationName?: InputMaybe<Scalars['String']['input']>;
  organizationSubdomain?: InputMaybe<Scalars['String']['input']>;
  ownerEmail?: InputMaybe<Scalars['String']['input']>;
  ownerFirstName?: InputMaybe<Scalars['String']['input']>;
  ownerLastName?: InputMaybe<Scalars['String']['input']>;
  ownerPassword?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  street?: InputMaybe<Scalars['String']['input']>;
  subdomain?: InputMaybe<Scalars['String']['input']>;
  teamIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  timezone?: InputMaybe<Scalars['String']['input']>;
  uvgContactPhone?: InputMaybe<Scalars['String']['input']>;
  uvgProvider?: InputMaybe<Scalars['String']['input']>;
  website?: InputMaybe<Scalars['String']['input']>;
  zip?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateOrganizationSettingInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  key: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
  value?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateProcessingActivityInput = {
  dataCategories?: InputMaybe<Scalars['String']['input']>;
  dataSubjects?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  legalBasis?: InputMaybe<ConsentLegalBasis>;
  name?: InputMaybe<Scalars['String']['input']>;
  purpose?: InputMaybe<Scalars['String']['input']>;
  recipients?: InputMaybe<Scalars['String']['input']>;
  retentionNote?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateProjectInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  status?: InputMaybe<ProjectStatus>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateProjectMemberRoleInput = {
  id: Scalars['ID']['input'];
  role: ProjectMemberRole;
};

export type UpdateProjectTemplateInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  tasks?: InputMaybe<Array<TemplateTaskInput>>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateProtocolInput = {
  endTime?: InputMaybe<Scalars['String']['input']>;
  externalParticipants?: InputMaybe<Array<Scalars['String']['input']>>;
  id: Scalars['ID']['input'];
  meetingDate?: InputMaybe<Scalars['String']['input']>;
  participantMembershipIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  projectId?: InputMaybe<Scalars['ID']['input']>;
  sections?: InputMaybe<ProtocolSectionsInput>;
  startTime?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<ProtocolStatus>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateProtocolTemplateInput = {
  agendaItems?: InputMaybe<Array<AgendaItemInput>>;
  defaultParticipantMembershipIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  id: Scalars['ID']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateRecordKeepingSettingsInput = {
  bigGapDays: Scalars['Int']['input'];
  introducedStuckDays: Scalars['Int']['input'];
  practicedStuckDays: Scalars['Int']['input'];
};

export type UpdateRolePermissionsInput = {
  permissionCodes: Array<Scalars['String']['input']>;
  roleId: Scalars['ID']['input'];
};

export type UpdateSchoolClassEnrollmentInput = {
  id: Scalars['ID']['input'];
  leftAt?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSchoolClassInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  gradeLevelIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  id: Scalars['ID']['input'];
  maxCapacity?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  room?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
  teacherIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export type UpdateStudentContactPersonInput = {
  emergencyPriority?: InputMaybe<Scalars['Int']['input']>;
  hasCustody?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['ID']['input'];
  isPickupAuthorized?: InputMaybe<Scalars['Boolean']['input']>;
  isPrimaryContact?: InputMaybe<Scalars['Boolean']['input']>;
  livesWithStudent?: InputMaybe<Scalars['Boolean']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  relationshipType?: InputMaybe<RelationshipType>;
};

export type UpdateStudentInput = {
  admissionStageId?: InputMaybe<Scalars['ID']['input']>;
  dateOfBirth?: InputMaybe<Scalars['String']['input']>;
  enrollmentDate?: InputMaybe<Scalars['String']['input']>;
  exitDate?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  gender?: InputMaybe<Gender>;
  id: Scalars['ID']['input'];
  lastName?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateStudentNoteInput = {
  category?: InputMaybe<StudentNoteCategory>;
  content?: InputMaybe<Scalars['String']['input']>;
  date?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  isConfidential?: InputMaybe<Scalars['Boolean']['input']>;
  studentId?: InputMaybe<Scalars['ID']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSubprocessorInput = {
  country?: InputMaybe<Scalars['String']['input']>;
  dpaSigned?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  purpose?: InputMaybe<Scalars['String']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTaskInput = {
  assigneeMembershipIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  checklist?: InputMaybe<Array<TaskChecklistItemInput>>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['String']['input']>;
  dueTime?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  priority?: InputMaybe<TaskPriority>;
  status?: InputMaybe<TaskStatus>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTeamInput = {
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  parentId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateTeamMemberInput = {
  employeeId?: InputMaybe<Scalars['ID']['input']>;
  id: Scalars['ID']['input'];
  role?: InputMaybe<TeamMemberRole>;
  teamId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateTimeTrackingInput = {
  breakMinutes?: InputMaybe<Scalars['Int']['input']>;
  employeeId?: InputMaybe<Scalars['ID']['input']>;
  endedAt?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  startedAt?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserInput = {
  addressLine2?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  dateOfBirth?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  houseNumber?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  lastName?: InputMaybe<Scalars['String']['input']>;
  postalCode?: InputMaybe<Scalars['String']['input']>;
  socialSecurityNumber?: InputMaybe<Scalars['String']['input']>;
  street?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};

export type UpsertCountryInputTemplateInput = {
  countryCode: Scalars['String']['input'];
  fieldType: CountryInputFieldType;
  mask: Scalars['String']['input'];
  maxLength?: InputMaybe<Scalars['Int']['input']>;
  placeholder?: InputMaybe<Scalars['String']['input']>;
  prefix?: InputMaybe<Scalars['String']['input']>;
  regex?: InputMaybe<Scalars['String']['input']>;
  validatorKind?: InputMaybe<CountryInputValidatorKind>;
};

export type UpsertCurriculumLevelTranslationInput = {
  curriculumLevelId: Scalars['ID']['input'];
  locale: CurriculumLocale;
  name: Scalars['String']['input'];
};

export type UpsertCurriculumNodeTranslationInput = {
  curriculumNodeId: Scalars['ID']['input'];
  locale: CurriculumLocale;
  name: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
};

export type UpsertCurriculumTranslationInput = {
  curriculumId: Scalars['ID']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  locale: CurriculumLocale;
  name: Scalars['String']['input'];
};

export type UpsertEmployeeAbsenceCategoryTranslationInput = {
  categoryId: Scalars['ID']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  locale: Locale;
  name: Scalars['String']['input'];
};

export type UpsertEmployeeEmergencyProfileInput = {
  allergies?: InputMaybe<Scalars['String']['input']>;
  bloodType?: InputMaybe<BloodType>;
  chronicConditions?: InputMaybe<Scalars['String']['input']>;
  contact1Email?: InputMaybe<Scalars['String']['input']>;
  contact1Name?: InputMaybe<Scalars['String']['input']>;
  contact1Phone?: InputMaybe<Scalars['String']['input']>;
  contact1Relationship?: InputMaybe<EmergencyContactRelationship>;
  contact2Email?: InputMaybe<Scalars['String']['input']>;
  contact2Name?: InputMaybe<Scalars['String']['input']>;
  contact2Phone?: InputMaybe<Scalars['String']['input']>;
  contact2Relationship?: InputMaybe<EmergencyContactRelationship>;
  emergencyMedications?: InputMaybe<Scalars['String']['input']>;
  employeeId: Scalars['ID']['input'];
  pharmacyName?: InputMaybe<Scalars['String']['input']>;
  primaryDoctorName?: InputMaybe<Scalars['String']['input']>;
  primaryDoctorPhone?: InputMaybe<Scalars['String']['input']>;
};

export type UpsertEmployeeHrProfileInput = {
  bankAccountHolder?: InputMaybe<Scalars['String']['input']>;
  bankName?: InputMaybe<Scalars['String']['input']>;
  bvgInsuranceNumber?: InputMaybe<Scalars['String']['input']>;
  criminalRecordSubmitted?: InputMaybe<Scalars['Boolean']['input']>;
  denomination?: InputMaybe<Scalars['String']['input']>;
  employeeId: Scalars['ID']['input'];
  iban?: InputMaybe<Scalars['String']['input']>;
  maritalStatus?: InputMaybe<EmployeeMaritalStatus>;
  nationality?: InputMaybe<Scalars['String']['input']>;
  ndaSigned?: InputMaybe<Scalars['Boolean']['input']>;
  numberOfChildren?: InputMaybe<Scalars['Int']['input']>;
  onboardingStatus?: InputMaybe<EmployeeOnboardingStatus>;
  residencePermitType?: InputMaybe<EmployeeResidencePermitType>;
  residencePermitValidUntil?: InputMaybe<Scalars['String']['input']>;
  withholdingTaxCode?: InputMaybe<Scalars['String']['input']>;
};

export type UpsertEmployeePeriodOpeningBalanceInput = {
  employeeId: Scalars['ID']['input'];
  openingVacationDays: Scalars['Float']['input'];
  openingWorkMinutes: Scalars['Int']['input'];
  periodId: Scalars['ID']['input'];
};

export type UpsertRetentionPolicyInput = {
  action?: InputMaybe<RetentionAction>;
  description?: InputMaybe<Scalars['String']['input']>;
  entityType: RetentionEntityType;
  isEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  retentionMonths: Scalars['Int']['input'];
};

export type User = {
  __typename?: 'User';
  addressLine2?: Maybe<Scalars['String']['output']>;
  avatarUrl?: Maybe<Scalars['String']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  dateOfBirth?: Maybe<Scalars['String']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  firstName: Scalars['String']['output'];
  houseNumber?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  isSuperAdmin?: Maybe<Scalars['Boolean']['output']>;
  language?: Maybe<Scalars['String']['output']>;
  lastName: Scalars['String']['output'];
  memberships: Array<Membership>;
  postalCode?: Maybe<Scalars['String']['output']>;
  privateEmail?: Maybe<Scalars['String']['output']>;
  socialSecurityNumber?: Maybe<Scalars['String']['output']>;
  street?: Maybe<Scalars['String']['output']>;
  theme?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  userEmails: Array<UserEmail>;
  username?: Maybe<Scalars['String']['output']>;
  version: Scalars['Int']['output'];
};

export type UserEmail = {
  __typename?: 'UserEmail';
  authAccounts?: Maybe<Array<AuthAccount>>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  isPrimary: Scalars['Boolean']['output'];
  isVerified: Scalars['Boolean']['output'];
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userId: Scalars['ID']['output'];
  version: Scalars['Int']['output'];
};

export type VacationBalance = {
  __typename?: 'VacationBalance';
  entitlementDays: Scalars['Float']['output'];
  openingDays: Scalars['Float']['output'];
  remainingDays: Scalars['Float']['output'];
  usedDays: Scalars['Float']['output'];
};

export type WeekdayTimeWindows = {
  __typename?: 'WeekdayTimeWindows';
  fri?: Maybe<Array<TimeWindow>>;
  mon?: Maybe<Array<TimeWindow>>;
  sat?: Maybe<Array<TimeWindow>>;
  sun?: Maybe<Array<TimeWindow>>;
  thu?: Maybe<Array<TimeWindow>>;
  tue?: Maybe<Array<TimeWindow>>;
  wed?: Maybe<Array<TimeWindow>>;
};

export type WeekdayTimeWindowsInput = {
  fri?: InputMaybe<Array<TimeWindowInput>>;
  mon?: InputMaybe<Array<TimeWindowInput>>;
  sat?: InputMaybe<Array<TimeWindowInput>>;
  sun?: InputMaybe<Array<TimeWindowInput>>;
  thu?: InputMaybe<Array<TimeWindowInput>>;
  tue?: InputMaybe<Array<TimeWindowInput>>;
  wed?: InputMaybe<Array<TimeWindowInput>>;
};

export type WeekdayWorkloads = {
  __typename?: 'WeekdayWorkloads';
  fri?: Maybe<Scalars['Float']['output']>;
  mon?: Maybe<Scalars['Float']['output']>;
  sat?: Maybe<Scalars['Float']['output']>;
  sun?: Maybe<Scalars['Float']['output']>;
  thu?: Maybe<Scalars['Float']['output']>;
  tue?: Maybe<Scalars['Float']['output']>;
  wed?: Maybe<Scalars['Float']['output']>;
};

export type WithdrawConsentInput = {
  id: Scalars['ID']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
};

export type WorkTimeBalance = {
  __typename?: 'WorkTimeBalance';
  absenceDaysCount: Scalars['Int']['output'];
  absenceMinutes: Scalars['Int']['output'];
  actualMinutes: Scalars['Int']['output'];
  differenceMinutes: Scalars['Int']['output'];
  employeeId: Scalars['ID']['output'];
  fromDate: Scalars['String']['output'];
  netBalanceMinutes: Scalars['Int']['output'];
  openingWorkMinutes: Scalars['Int']['output'];
  paidOvertimeMinutes: Scalars['Int']['output'];
  plannedMinutes: Scalars['Int']['output'];
  toDate: Scalars['String']['output'];
  vacationDaysUsed: Scalars['Int']['output'];
  vacationMinutes: Scalars['Int']['output'];
  workedMinutes: Scalars['Int']['output'];
};

export type AccessReviewQueryVariables = Exact<{ [key: string]: never; }>;


export type AccessReviewQuery = { __typename?: 'Query', accessReview: Array<{ __typename?: 'AccessReviewEntry', membershipId: string, memberName: string, roles: Array<string>, sensitivePermissions: Array<string>, lastReviewedAt?: any | null }> };

export type RecertifyAccessMutationVariables = Exact<{
  membershipId: Scalars['ID']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
}>;


export type RecertifyAccessMutation = { __typename?: 'Mutation', recertifyAccess: boolean };

export type ArchiveApplicationContactPersonMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ArchiveApplicationContactPersonMutation = { __typename?: 'Mutation', archiveContactPerson: boolean };

export type ArchiveAdmissionApplicationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ArchiveAdmissionApplicationMutation = { __typename?: 'Mutation', archiveAdmissionApplication: boolean };

export type RejectAdmissionApplicationMutationVariables = Exact<{
  input: RejectAdmissionApplicationInput;
}>;


export type RejectAdmissionApplicationMutation = { __typename?: 'Mutation', rejectAdmissionApplication: { __typename?: 'AdmissionApplication', id: string, status: AdmissionApplicationStatus, rejectionReason?: string | null, rejectionReasonId?: string | null, rejectedBy?: AdmissionRejectedBy | null } };

export type DeleteAdmissionApplicationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteAdmissionApplicationMutation = { __typename?: 'Mutation', deleteAdmissionApplication: boolean };

export type RestoreAdmissionApplicationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RestoreAdmissionApplicationMutation = { __typename?: 'Mutation', restoreAdmissionApplication: { __typename?: 'AdmissionApplication', id: string, status: AdmissionApplicationStatus } };

export type UpdateAdmissionBoardSettingsMutationVariables = Exact<{
  input: UpdateAdmissionBoardSettingsInput;
}>;


export type UpdateAdmissionBoardSettingsMutation = { __typename?: 'Mutation', updateAdmissionBoardSettings: { __typename?: 'AdmissionBoardSettings', tableColumns?: Array<string> | null } };

export type CreateAdmissionActivityMutationVariables = Exact<{
  input: CreateAdmissionActivityInput;
}>;


export type CreateAdmissionActivityMutation = { __typename?: 'Mutation', createAdmissionActivity: { __typename?: 'AdmissionActivity', id: string } };

export type CreateApplicationContactPersonMutationVariables = Exact<{
  input: CreateContactPersonInput;
}>;


export type CreateApplicationContactPersonMutation = { __typename?: 'Mutation', createContactPerson: { __typename?: 'ContactPerson', id: string } };

export type CreateAdmissionApplicationMutationVariables = Exact<{
  input: CreateAdmissionApplicationInput;
}>;


export type CreateAdmissionApplicationMutation = { __typename?: 'Mutation', createAdmissionApplication: { __typename?: 'AdmissionApplication', id: string, admissionStageId: string, familyId: string } };

export type DeleteAdmissionActivityMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteAdmissionActivityMutation = { __typename?: 'Mutation', deleteAdmissionActivity: boolean };

export type FinalizeAdmissionEnrollmentMutationVariables = Exact<{
  input: FinalizeEnrollmentInput;
}>;


export type FinalizeAdmissionEnrollmentMutation = { __typename?: 'Mutation', finalizeAdmissionEnrollment: { __typename?: 'FinalizeEnrollmentOutput', application: { __typename?: 'AdmissionApplication', id: string, status: AdmissionApplicationStatus, enrolledStudentId?: string | null }, student: { __typename?: 'Student', id: string, firstName: string, lastName: string } } };

export type AdmissionActivitiesQueryVariables = Exact<{
  applicationId: Scalars['ID']['input'];
}>;


export type AdmissionActivitiesQuery = { __typename?: 'Query', admissionActivities: Array<{ __typename?: 'AdmissionActivity', id: string, applicationId: string, type: AdmissionActivityType, occurredAt: any, subject?: string | null, body?: string | null, direction?: AdmissionActivityDirection | null, durationMinutes?: number | null, location?: string | null, createdAt: any, updatedAt: any, createdByMembershipId?: string | null, createdByMembership?: { __typename?: 'Membership', id: string, user?: { __typename?: 'User', firstName: string, lastName: string } | null } | null }> };

export type AdmissionAppointmentsByApplicationQueryVariables = Exact<{
  applicationId: Scalars['ID']['input'];
}>;


export type AdmissionAppointmentsByApplicationQuery = { __typename?: 'Query', admissionAppointmentsByApplication: Array<{ __typename?: 'AdmissionAppointment', id: string, applicationId: string, appointmentTypeId?: string | null, title?: string | null, scheduledAt: any, endsAt?: any | null, durationMinutes?: number | null, location?: string | null, note?: string | null, status: AdmissionAppointmentStatus, createdAt: any, appointmentType?: { __typename?: 'AdmissionAppointmentType', id: string, label: string, color?: string | null } | null, assignees?: Array<{ __typename?: 'AdmissionAppointmentAssignee', membershipId: string, membership?: { __typename?: 'Membership', id: string, user?: { __typename?: 'User', firstName: string, lastName: string } | null } | null }> | null }> };

export type AdmissionDocumentsByApplicationQueryVariables = Exact<{
  applicationId: Scalars['ID']['input'];
}>;


export type AdmissionDocumentsByApplicationQuery = { __typename?: 'Query', admissionDocumentsByApplication: Array<{ __typename?: 'AdmissionDocument', id: string, originalName: string, title?: string | null, tags: Array<string>, mimeType: string, sizeBytes: number, createdAt: any, uploadedByMembership?: { __typename?: 'Membership', id: string, user?: { __typename?: 'User', firstName: string, lastName: string } | null } | null }> };

export type AdmissionEmailsQueryVariables = Exact<{
  applicationId: Scalars['ID']['input'];
}>;


export type AdmissionEmailsQuery = { __typename?: 'Query', admissionEmails: Array<{ __typename?: 'AdmissionEmail', id: string, toEmail: string, toName?: string | null, subject: string, bodyHtml: string, status: AdmissionEmailStatus, errorMessage?: string | null, sentAt: any, template?: { __typename?: 'EmailTemplate', id: string, name: string } | null, sentByMembership?: { __typename?: 'Membership', id: string, user?: { __typename?: 'User', firstName: string, lastName: string } | null } | null }> };

export type AdmissionRemindersQueryVariables = Exact<{
  applicationId: Scalars['ID']['input'];
}>;


export type AdmissionRemindersQuery = { __typename?: 'Query', admissionReminders: Array<{ __typename?: 'AdmissionReminder', id: string, applicationId: string, dueAt: any, title: string, note?: string | null, assignedToMembershipId?: string | null, completedAt?: any | null, createdAt: any, assignedToMembership?: { __typename?: 'Membership', id: string, user?: { __typename?: 'User', firstName: string, lastName: string } | null } | null }> };

export type AdmissionsKanbanRemindersQueryVariables = Exact<{ [key: string]: never; }>;


export type AdmissionsKanbanRemindersQuery = { __typename?: 'Query', orgAdmissionReminders: Array<{ __typename?: 'AdmissionReminder', id: string, applicationId: string, dueAt: any }> };

export type AdmissionsKanbanStagesQueryVariables = Exact<{ [key: string]: never; }>;


export type AdmissionsKanbanStagesQuery = { __typename?: 'Query', admissionStages: Array<{ __typename?: 'AdmissionStage', id: string, name: string, slug: string, color?: string | null, position: number, stageType: AdmissionStageType, isDefault: boolean, isArchived: boolean, cardFields?: Array<string> | null }> };

export type AdmissionsBoardSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type AdmissionsBoardSettingsQuery = { __typename?: 'Query', admissionBoardSettings: { __typename?: 'AdmissionBoardSettings', tableColumns?: Array<string> | null } };

export type AdmissionsKanbanRejectionReasonsQueryVariables = Exact<{ [key: string]: never; }>;


export type AdmissionsKanbanRejectionReasonsQuery = { __typename?: 'Query', admissionRejectionReasons: Array<{ __typename?: 'AdmissionRejectionReason', id: string, label: string, color?: string | null, position: number }> };

export type AdmissionsKanbanSourcesQueryVariables = Exact<{ [key: string]: never; }>;


export type AdmissionsKanbanSourcesQuery = { __typename?: 'Query', admissionSources: Array<{ __typename?: 'AdmissionSource', id: string, name: string, color?: string | null, isArchived: boolean, position: number }> };

export type AdmissionsKanbanApplicationsQueryVariables = Exact<{ [key: string]: never; }>;


export type AdmissionsKanbanApplicationsQuery = { __typename?: 'Query', admissionApplications: Array<{ __typename?: 'AdmissionApplication', id: string, admissionStageId: string, position: number, childFirstName: string, childLastName: string, childDateOfBirth?: string | null, childGender?: Gender | null, status: AdmissionApplicationStatus, stageEnteredAt: any, familyId: string, enrolledStudentId?: string | null, assignedGradeLevelId?: string | null, admissionSource?: { __typename?: 'AdmissionSource', id: string, name: string, color?: string | null } | null, assignedGradeLevel?: { __typename?: 'GradeLevel', id: string, name: string, shortCode?: string | null, color?: string | null, parent?: { __typename?: 'GradeLevel', id: string, name: string, shortCode?: string | null, color?: string | null } | null } | null, family?: { __typename?: 'Family', id: string, name?: string | null, contactPersons: Array<{ __typename?: 'ContactPerson', id: string, firstName: string, lastName: string, email?: string | null, phone?: string | null, mobile?: string | null, roles: Array<RelationshipType> }> } | null }> };

export type AdmissionApplicationDetailQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type AdmissionApplicationDetailQuery = { __typename?: 'Query', admissionApplicationById: { __typename?: 'AdmissionApplication', id: string, organizationId: string, admissionStageId: string, status: AdmissionApplicationStatus, stageEnteredAt: any, createdAt: any, position: number, childFirstName: string, childLastName: string, childDateOfBirth?: string | null, childGender?: Gender | null, childNotes?: string | null, assignedGradeLevelId?: string | null, desiredSchoolClassId?: string | null, desiredEnrollmentDate?: string | null, enrolledStudentId?: string | null, familyId: string, admissionSource?: { __typename?: 'AdmissionSource', id: string, name: string, color?: string | null } | null, family?: { __typename?: 'Family', id: string, name?: string | null, notes?: string | null, contactPersons: Array<{ __typename?: 'ContactPerson', id: string, salutation?: Salutation | null, firstName: string, lastName: string, email?: string | null, phone?: string | null, mobile?: string | null, roles: Array<RelationshipType>, occupation?: string | null, sortOrder: number }> } | null, admissionStage?: { __typename?: 'AdmissionStage', id: string, name: string, stageType: AdmissionStageType } | null, desiredSchoolClass?: { __typename?: 'SchoolClass', id: string, name: string } | null, assignedGradeLevel?: { __typename?: 'GradeLevel', id: string, name: string, color?: string | null } | null }, admissionAuditLogs: Array<{ __typename?: 'AdmissionAuditLog', id: string, action: AdmissionAuditAction, createdAt: any, fieldName?: string | null, oldValue?: string | null, newValue?: string | null, fromStage?: { __typename?: 'AdmissionStage', id: string, name: string } | null, toStage?: { __typename?: 'AdmissionStage', id: string, name: string } | null, actorMembership?: { __typename?: 'Membership', id: string, user?: { __typename?: 'User', firstName: string, lastName: string } | null } | null }>, admissionApplicationsByFamily?: Array<{ __typename?: 'AdmissionApplication', id: string }> };

export type AdmissionApplicationSiblingsQueryVariables = Exact<{
  familyId: Scalars['ID']['input'];
}>;


export type AdmissionApplicationSiblingsQuery = { __typename?: 'Query', admissionApplicationsByFamily: Array<{ __typename?: 'AdmissionApplication', id: string, childFirstName: string, childLastName: string, childDateOfBirth?: string | null, status: AdmissionApplicationStatus, admissionStage?: { __typename?: 'AdmissionStage', id: string, name: string, color?: string | null } | null }> };

export type OrgAdmissionRemindersQueryVariables = Exact<{
  filter?: InputMaybe<AdmissionReminderFilter>;
}>;


export type OrgAdmissionRemindersQuery = { __typename?: 'Query', orgAdmissionReminders: Array<{ __typename?: 'AdmissionReminder', id: string, applicationId: string, dueAt: any, title: string, note?: string | null, completedAt?: any | null, application?: { __typename?: 'AdmissionApplication', id: string, childFirstName: string, childLastName: string } | null, assignedToMembership?: { __typename?: 'Membership', id: string, user?: { __typename?: 'User', firstName: string, lastName: string } | null } | null }> };

export type RejectedAdmissionApplicationsQueryVariables = Exact<{ [key: string]: never; }>;


export type RejectedAdmissionApplicationsQuery = { __typename?: 'Query', admissionApplications: Array<{ __typename?: 'AdmissionApplication', id: string, status: AdmissionApplicationStatus, childFirstName: string, childLastName: string, stageEnteredAt: any, rejectionReason?: string | null, rejectionReasonId?: string | null, rejectedBy?: AdmissionRejectedBy | null, followUpYear?: string | null, family?: { __typename?: 'Family', name?: string | null } | null, assignedGradeLevel?: { __typename?: 'GradeLevel', name: string } | null }>, admissionRejectionReasons: Array<{ __typename?: 'AdmissionRejectionReason', id: string, label: string, color?: string | null }> };

export type AdmissionsEnrollmentClassesQueryVariables = Exact<{ [key: string]: never; }>;


export type AdmissionsEnrollmentClassesQuery = { __typename?: 'Query', schoolClassesByOrgId: Array<{ __typename?: 'SchoolClass', id: string, name: string, isActive: boolean, gradeLevels?: Array<{ __typename?: 'GradeLevel', id: string, name: string }> | null }> };

export type MoveAdmissionApplicationMutationVariables = Exact<{
  input: MoveAdmissionApplicationInput;
}>;


export type MoveAdmissionApplicationMutation = { __typename?: 'Mutation', moveAdmissionApplication: { __typename?: 'AdmissionApplication', id: string, admissionStageId: string, position: number, stageEnteredAt: any } };

export type CreateAdmissionAppointmentMutationVariables = Exact<{
  input: CreateAdmissionAppointmentInput;
}>;


export type CreateAdmissionAppointmentMutation = { __typename?: 'Mutation', createAdmissionAppointment: { __typename?: 'AdmissionAppointment', id: string } };

export type UpdateAdmissionAppointmentMutationVariables = Exact<{
  input: UpdateAdmissionAppointmentInput;
}>;


export type UpdateAdmissionAppointmentMutation = { __typename?: 'Mutation', updateAdmissionAppointment: { __typename?: 'AdmissionAppointment', id: string } };

export type DeleteAdmissionAppointmentMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteAdmissionAppointmentMutation = { __typename?: 'Mutation', deleteAdmissionAppointment: boolean };

export type ResendAdmissionEmailMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ResendAdmissionEmailMutation = { __typename?: 'Mutation', resendAdmissionEmail: { __typename?: 'AdmissionEmail', id: string, status: AdmissionEmailStatus, errorMessage?: string | null } };

export type DeleteAdmissionEmailMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteAdmissionEmailMutation = { __typename?: 'Mutation', deleteAdmissionEmail: boolean };

export type CreateAdmissionReminderMutationVariables = Exact<{
  input: CreateAdmissionReminderInput;
}>;


export type CreateAdmissionReminderMutation = { __typename?: 'Mutation', createAdmissionReminder: { __typename?: 'AdmissionReminder', id: string } };

export type UpdateAdmissionReminderMutationVariables = Exact<{
  input: UpdateAdmissionReminderInput;
}>;


export type UpdateAdmissionReminderMutation = { __typename?: 'Mutation', updateAdmissionReminder: { __typename?: 'AdmissionReminder', id: string } };

export type CompleteAdmissionReminderMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type CompleteAdmissionReminderMutation = { __typename?: 'Mutation', completeAdmissionReminder: { __typename?: 'AdmissionReminder', id: string } };

export type UncompleteAdmissionReminderMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type UncompleteAdmissionReminderMutation = { __typename?: 'Mutation', uncompleteAdmissionReminder: { __typename?: 'AdmissionReminder', id: string } };

export type DeleteAdmissionReminderMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteAdmissionReminderMutation = { __typename?: 'Mutation', deleteAdmissionReminder: boolean };

export type PreviewAdmissionEmailQueryVariables = Exact<{
  applicationId: Scalars['ID']['input'];
  templateId: Scalars['ID']['input'];
}>;


export type PreviewAdmissionEmailQuery = { __typename?: 'Query', previewAdmissionEmail: { __typename?: 'AdmissionEmailPreview', subject: string, bodyHtml: string, toEmail?: string | null, toName?: string | null, availableVariables: Array<string> } };

export type ReorderAdmissionApplicationsMutationVariables = Exact<{
  input: ReorderAdmissionApplicationsInput;
}>;


export type ReorderAdmissionApplicationsMutation = { __typename?: 'Mutation', reorderAdmissionApplications: Array<{ __typename?: 'AdmissionApplication', id: string, position: number }> };

export type SendAdmissionEmailMutationVariables = Exact<{
  input: SendAdmissionEmailInput;
}>;


export type SendAdmissionEmailMutation = { __typename?: 'Mutation', sendAdmissionEmail: { __typename?: 'AdmissionEmail', id: string, status: AdmissionEmailStatus, errorMessage?: string | null } };

export type CreateAdmissionStageMutationVariables = Exact<{
  input: CreateAdmissionStageInput;
}>;


export type CreateAdmissionStageMutation = { __typename?: 'Mutation', createAdmissionStage: { __typename?: 'AdmissionStage', id: string, name: string, slug: string, color?: string | null, position: number, stageType: AdmissionStageType, isDefault: boolean, cardFields?: Array<string> | null } };

export type UpdateAdmissionStageMutationVariables = Exact<{
  input: UpdateAdmissionStageInput;
}>;


export type UpdateAdmissionStageMutation = { __typename?: 'Mutation', updateAdmissionStage: { __typename?: 'AdmissionStage', id: string, name: string, slug: string, color?: string | null, position: number, stageType: AdmissionStageType, isDefault: boolean, cardFields?: Array<string> | null } };

export type ArchiveAdmissionStageMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ArchiveAdmissionStageMutation = { __typename?: 'Mutation', archiveAdmissionStage: boolean };

export type ReorderAdmissionStagesMutationVariables = Exact<{
  input: ReorderAdmissionStagesInput;
}>;


export type ReorderAdmissionStagesMutation = { __typename?: 'Mutation', reorderAdmissionStages: Array<{ __typename?: 'AdmissionStage', id: string, position: number }> };

export type UpdateAdmissionActivityMutationVariables = Exact<{
  input: UpdateAdmissionActivityInput;
}>;


export type UpdateAdmissionActivityMutation = { __typename?: 'Mutation', updateAdmissionActivity: { __typename?: 'AdmissionActivity', id: string } };

export type UpdateContactPersonMutationVariables = Exact<{
  input: UpdateContactPersonInput;
}>;


export type UpdateContactPersonMutation = { __typename?: 'Mutation', updateContactPerson: { __typename?: 'ContactPerson', id: string } };

export type UpdateAdmissionApplicationMutationVariables = Exact<{
  input: UpdateAdmissionApplicationInput;
}>;


export type UpdateAdmissionApplicationMutation = { __typename?: 'Mutation', updateAdmissionApplication: { __typename?: 'AdmissionApplication', id: string } };

export type AuthUserIdByUserIdQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type AuthUserIdByUserIdQuery = { __typename?: 'Query', authUserIdByUserId?: string | null };

export type ArchiveConsentPurposeMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ArchiveConsentPurposeMutation = { __typename?: 'Mutation', archiveConsentPurpose: boolean };

export type ConsentPurposesQueryVariables = Exact<{
  includeArchived?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type ConsentPurposesQuery = { __typename?: 'Query', consentPurposes: Array<{ __typename?: 'ConsentPurpose', id: string, name: string, slug: string, description?: string | null, appliesTo: Array<ConsentSubjectType>, legalBasis: ConsentLegalBasis, requiresEvidence: boolean, isMandatory: boolean, position: number, isArchived: boolean }> };

export type ConsentsForSubjectQueryVariables = Exact<{
  subjectType: ConsentSubjectType;
  subjectId: Scalars['ID']['input'];
}>;


export type ConsentsForSubjectQuery = { __typename?: 'Query', consentsForSubject: Array<{ __typename?: 'Consent', id: string, subjectType: ConsentSubjectType, subjectId: string, purposeId: string, status: ConsentStatus, grantedByContactPersonId?: string | null, decidedAt: any, withdrawnAt?: any | null, evidenceUrl?: string | null, note?: string | null, purpose?: { __typename?: 'ConsentPurpose', id: string, name: string, slug: string } | null }> };

export type RecordConsentMutationVariables = Exact<{
  input: RecordConsentInput;
}>;


export type RecordConsentMutation = { __typename?: 'Mutation', recordConsent: { __typename?: 'Consent', id: string, status: ConsentStatus } };

export type CreateConsentPurposeMutationVariables = Exact<{
  input: CreateConsentPurposeInput;
}>;


export type CreateConsentPurposeMutation = { __typename?: 'Mutation', createConsentPurpose: { __typename?: 'ConsentPurpose', id: string } };

export type UpdateConsentPurposeMutationVariables = Exact<{
  input: UpdateConsentPurposeInput;
}>;


export type UpdateConsentPurposeMutation = { __typename?: 'Mutation', updateConsentPurpose: { __typename?: 'ConsentPurpose', id: string } };

export type WithdrawConsentMutationVariables = Exact<{
  input: WithdrawConsentInput;
}>;


export type WithdrawConsentMutation = { __typename?: 'Mutation', withdrawConsent: { __typename?: 'Consent', id: string, status: ConsentStatus } };

export type ArchiveContactPersonMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ArchiveContactPersonMutation = { __typename?: 'Mutation', archiveContactPerson: boolean };

export type CreateAddressMutationVariables = Exact<{
  input: CreateAddressInput;
}>;


export type CreateAddressMutation = { __typename?: 'Mutation', createAddress: { __typename?: 'Address', id: string } };

export type CreateContactPersonMutationVariables = Exact<{
  input: CreateContactPersonInput;
}>;


export type CreateContactPersonMutation = { __typename?: 'Mutation', createContactPerson: { __typename?: 'ContactPerson', id: string } };

export type GetContactPersonsSharingAddressQueryVariables = Exact<{
  addressId: Scalars['ID']['input'];
  excludeContactPersonId: Scalars['ID']['input'];
}>;


export type GetContactPersonsSharingAddressQuery = { __typename?: 'Query', contactPersonsSharingAddress: Array<{ __typename?: 'ContactPerson', id: string, firstName: string, lastName: string, roles: Array<RelationshipType> }> };

export type GetContactPersonByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetContactPersonByIdQuery = { __typename?: 'Query', contactPersonById: { __typename?: 'ContactPerson', id: string, salutation?: Salutation | null, title?: string | null, firstName: string, middleName?: string | null, lastName: string, email?: string | null, phone?: string | null, mobile?: string | null, dateOfBirth?: string | null, socialSecurityNumber?: string | null, nationalities: Array<string>, preferredLanguages: Array<string>, roles: Array<RelationshipType>, occupation?: string | null, notes?: string | null, addressId?: string | null, address?: { __typename?: 'Address', id: string, street?: string | null, houseNumber?: string | null, addressLine2?: string | null, postalCode?: string | null, city?: string | null, state?: string | null, country?: { __typename?: 'Country', id: string, isoCode?: string | null } | null } | null } };

export type GetContactPersonsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetContactPersonsQuery = { __typename?: 'Query', contactPersonsByOrgId: Array<{ __typename?: 'ContactPerson', id: string, firstName: string, lastName: string, email?: string | null, phone?: string | null, mobile?: string | null, occupation?: string | null, isArchived: boolean }> };

export type GetRelatedAddressesQueryVariables = Exact<{
  contactPersonId: Scalars['ID']['input'];
}>;


export type GetRelatedAddressesQuery = { __typename?: 'Query', relatedAddressesForContactPerson: Array<{ __typename?: 'AddressSuggestion', contactPersonName: string, relationshipType: string, studentName: string, address: { __typename?: 'Address', id: string, street?: string | null, houseNumber?: string | null, addressLine2?: string | null, postalCode?: string | null, city?: string | null, state?: string | null, country?: { __typename?: 'Country', id: string, isoCode?: string | null } | null } }> };

export type GetContactPersonsByStudentIdQueryVariables = Exact<{
  studentId: Scalars['ID']['input'];
}>;


export type GetContactPersonsByStudentIdQuery = { __typename?: 'Query', contactPersonsByStudentId: Array<{ __typename?: 'StudentContactPerson', id: string, relationshipType: RelationshipType, isPrimaryContact: boolean, hasCustody: boolean, isPickupAuthorized: boolean, emergencyPriority?: number | null, livesWithStudent: boolean, notes?: string | null, contactPerson: { __typename?: 'ContactPerson', id: string, firstName: string, lastName: string, email?: string | null, phone?: string | null, mobile?: string | null } }> };

export type LinkContactPersonToStudentMutationVariables = Exact<{
  input: LinkContactPersonInput;
}>;


export type LinkContactPersonToStudentMutation = { __typename?: 'Mutation', linkContactPersonToStudent: { __typename?: 'StudentContactPerson', id: string } };

export type UnlinkContactPersonFromStudentMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type UnlinkContactPersonFromStudentMutation = { __typename?: 'Mutation', unlinkContactPersonFromStudent: boolean };

export type UpdateAddressMutationVariables = Exact<{
  input: UpdateAddressInput;
}>;


export type UpdateAddressMutation = { __typename?: 'Mutation', updateAddress: { __typename?: 'Address', id: string } };

export type UpdateStudentContactPersonLinkMutationVariables = Exact<{
  input: UpdateStudentContactPersonInput;
}>;


export type UpdateStudentContactPersonLinkMutation = { __typename?: 'Mutation', updateStudentContactPersonLink: { __typename?: 'StudentContactPerson', id: string } };

export type DeleteCountryInputTemplateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteCountryInputTemplateMutation = { __typename?: 'Mutation', deleteCountryInputTemplate: boolean };

export type CountryInputTemplatesQueryVariables = Exact<{ [key: string]: never; }>;


export type CountryInputTemplatesQuery = { __typename?: 'Query', countryInputTemplates: Array<{ __typename?: 'CountryInputTemplate', id: string, countryCode: string, fieldType: CountryInputFieldType, mask: string, placeholder?: string | null, maxLength?: number | null, regex?: string | null, prefix?: string | null, validatorKind: CountryInputValidatorKind }> };

export type UpsertCountryInputTemplateMutationVariables = Exact<{
  input: UpsertCountryInputTemplateInput;
}>;


export type UpsertCountryInputTemplateMutation = { __typename?: 'Mutation', upsertCountryInputTemplate: { __typename?: 'CountryInputTemplate', id: string, countryCode: string, fieldType: CountryInputFieldType, mask: string, placeholder?: string | null, maxLength?: number | null, regex?: string | null, prefix?: string | null, validatorKind: CountryInputValidatorKind } };

export type ArchiveCurriculumNodeMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ArchiveCurriculumNodeMutation = { __typename?: 'Mutation', archiveCurriculumNode: boolean };

export type ArchiveCurriculumMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ArchiveCurriculumMutation = { __typename?: 'Mutation', archiveCurriculum: boolean };

export type CreateCurriculumMutationVariables = Exact<{
  input: CreateCurriculumInput;
}>;


export type CreateCurriculumMutation = { __typename?: 'Mutation', createCurriculum: { __typename?: 'Curriculum', id: string, slug: string, position: number, isArchived: boolean, translations?: Array<{ __typename?: 'CurriculumTranslation', locale: CurriculumLocale, name: string, description?: string | null }> | null } };

export type GetCurriculaQueryVariables = Exact<{
  includeArchived?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetCurriculaQuery = { __typename?: 'Query', curricula: Array<{ __typename?: 'Curriculum', id: string, slug: string, position: number, isArchived: boolean, translations?: Array<{ __typename?: 'CurriculumTranslation', locale: CurriculumLocale, name: string, description?: string | null }> | null }> };

export type GetCurriculumByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetCurriculumByIdQuery = { __typename?: 'Query', curriculumById: { __typename?: 'Curriculum', id: string, slug: string, position: number, isArchived: boolean, translations?: Array<{ __typename?: 'CurriculumTranslation', locale: CurriculumLocale, name: string, description?: string | null }> | null } };

export type GetCurriculumLevelsQueryVariables = Exact<{
  curriculumId: Scalars['ID']['input'];
  includeArchived?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetCurriculumLevelsQuery = { __typename?: 'Query', curriculumLevels: Array<{ __typename?: 'CurriculumLevel', id: string, slug: string, position: number, isArchived: boolean, translations?: Array<{ __typename?: 'CurriculumLevelTranslation', locale: CurriculumLocale, name: string }> | null }> };

export type GetCurriculumNodesQueryVariables = Exact<{
  curriculumId: Scalars['ID']['input'];
  levelId: Scalars['ID']['input'];
  includeArchived?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetCurriculumNodesQuery = { __typename?: 'Query', curriculumNodes: Array<{ __typename?: 'CurriculumNode', id: string, curriculumId: string, levelId: string, parentId?: string | null, nodeType: CurriculumNodeType, position: number, isArchived: boolean, lessonType?: LessonType | null, lessonScale?: LessonScale | null, translations?: Array<{ __typename?: 'CurriculumNodeTranslation', locale: CurriculumLocale, name: string, notes?: string | null }> | null }> };

export type HardDeleteCurriculumMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type HardDeleteCurriculumMutation = { __typename?: 'Mutation', hardDeleteCurriculum: boolean };

export type ImportCurriculumFromPlanMutationVariables = Exact<{
  input: ImportCurriculumPlanInput;
}>;


export type ImportCurriculumFromPlanMutation = { __typename?: 'Mutation', importCurriculumFromPlan: { __typename?: 'Curriculum', id: string, slug: string, position: number, isArchived: boolean, translations?: Array<{ __typename?: 'CurriculumTranslation', locale: CurriculumLocale, name: string, description?: string | null }> | null } };

export type ReorderCurriculumNodesMutationVariables = Exact<{
  input: ReorderCurriculumNodesInput;
}>;


export type ReorderCurriculumNodesMutation = { __typename?: 'Mutation', reorderCurriculumNodes: Array<{ __typename?: 'CurriculumNode', id: string, parentId?: string | null, position: number }> };

export type UnarchiveCurriculumNodeMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type UnarchiveCurriculumNodeMutation = { __typename?: 'Mutation', unarchiveCurriculumNode: boolean };

export type UnarchiveCurriculumMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type UnarchiveCurriculumMutation = { __typename?: 'Mutation', unarchiveCurriculum: { __typename?: 'Curriculum', id: string, isArchived: boolean } };

export type UpdateCurriculumMutationVariables = Exact<{
  input: UpdateCurriculumInput;
}>;


export type UpdateCurriculumMutation = { __typename?: 'Mutation', updateCurriculum: { __typename?: 'Curriculum', id: string, slug: string, position: number, isArchived: boolean, translations?: Array<{ __typename?: 'CurriculumTranslation', locale: CurriculumLocale, name: string, description?: string | null }> | null } };

export type UpdateLessonClassificationMutationVariables = Exact<{
  input: UpdateCurriculumNodeInput;
}>;


export type UpdateLessonClassificationMutation = { __typename?: 'Mutation', updateCurriculumNode: { __typename?: 'CurriculumNode', id: string, lessonType?: LessonType | null, lessonScale?: LessonScale | null } };

export type UpsertCurriculumLevelTranslationMutationVariables = Exact<{
  input: UpsertCurriculumLevelTranslationInput;
}>;


export type UpsertCurriculumLevelTranslationMutation = { __typename?: 'Mutation', upsertCurriculumLevelTranslation: { __typename?: 'CurriculumLevelTranslation', locale: CurriculumLocale, name: string } };

export type UpsertCurriculumNodeTranslationMutationVariables = Exact<{
  input: UpsertCurriculumNodeTranslationInput;
}>;


export type UpsertCurriculumNodeTranslationMutation = { __typename?: 'Mutation', upsertCurriculumNodeTranslation: { __typename?: 'CurriculumNodeTranslation', locale: CurriculumLocale, name: string, notes?: string | null } };

export type CreateDataBreachMutationVariables = Exact<{
  input: CreateDataBreachInput;
}>;


export type CreateDataBreachMutation = { __typename?: 'Mutation', createDataBreach: { __typename?: 'DataBreachIncident', id: string } };

export type DataBreachesQueryVariables = Exact<{
  status?: InputMaybe<DataBreachStatus>;
}>;


export type DataBreachesQuery = { __typename?: 'Query', dataBreaches: Array<{ __typename?: 'DataBreachIncident', id: string, title: string, description: string, detectedAt: any, status: DataBreachStatus, riskLevel: DataBreachRiskLevel, affectedScope?: string | null, affectedCount?: number | null, authorityNotifiedAt?: any | null, subjectsNotifiedAt?: any | null, measures?: string | null, closedAt?: any | null, notes?: string | null, authorityNotificationDueAt: any, assigneeMembership?: { __typename?: 'Membership', id: string, user?: { __typename?: 'User', firstName: string, lastName: string } | null } | null }> };

export type UpdateDataBreachMutationVariables = Exact<{
  input: UpdateDataBreachInput;
}>;


export type UpdateDataBreachMutation = { __typename?: 'Mutation', updateDataBreach: { __typename?: 'DataBreachIncident', id: string, status: DataBreachStatus } };

export type CreateDataSubjectRequestMutationVariables = Exact<{
  input: CreateDataSubjectRequestInput;
}>;


export type CreateDataSubjectRequestMutation = { __typename?: 'Mutation', createDataSubjectRequest: { __typename?: 'DataSubjectRequest', id: string } };

export type DataSubjectRequestsQueryVariables = Exact<{
  status?: InputMaybe<DataSubjectRequestStatus>;
}>;


export type DataSubjectRequestsQuery = { __typename?: 'Query', dataSubjectRequests: Array<{ __typename?: 'DataSubjectRequest', id: string, type: DataSubjectRequestType, status: DataSubjectRequestStatus, subjectType: DataSubjectType, subjectId?: string | null, subjectName: string, contactEmail?: string | null, receivedAt: any, dueDate: any, resolvedAt?: any | null, resolutionNote?: string | null, notes?: string | null, assigneeMembershipId?: string | null, assigneeMembership?: { __typename?: 'Membership', id: string, user?: { __typename?: 'User', firstName: string, lastName: string } | null } | null }> };

export type DataSubjectExportQueryVariables = Exact<{
  subjectType: DataSubjectType;
  subjectId: Scalars['ID']['input'];
}>;


export type DataSubjectExportQuery = { __typename?: 'Query', dataSubjectExport: string };

export type UpdateDataSubjectRequestMutationVariables = Exact<{
  input: UpdateDataSubjectRequestInput;
}>;


export type UpdateDataSubjectRequestMutation = { __typename?: 'Mutation', updateDataSubjectRequest: { __typename?: 'DataSubjectRequest', id: string, status: DataSubjectRequestStatus } };

export type EmailTemplatesQueryVariables = Exact<{
  category?: InputMaybe<EmailTemplateCategory>;
}>;


export type EmailTemplatesQuery = { __typename?: 'Query', emailTemplates: Array<{ __typename?: 'EmailTemplate', id: string, name: string, category: EmailTemplateCategory, subject: string, bodyHtml: string, description?: string | null, isAutomatic: boolean, sentCount: number, createdAt: any, updatedAt: any }> };

export type CreateEmailTemplateMutationVariables = Exact<{
  input: CreateEmailTemplateInput;
}>;


export type CreateEmailTemplateMutation = { __typename?: 'Mutation', createEmailTemplate: { __typename?: 'EmailTemplate', id: string } };

export type UpdateEmailTemplateMutationVariables = Exact<{
  input: UpdateEmailTemplateInput;
}>;


export type UpdateEmailTemplateMutation = { __typename?: 'Mutation', updateEmailTemplate: { __typename?: 'EmailTemplate', id: string } };

export type DeleteEmailTemplateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteEmailTemplateMutation = { __typename?: 'Mutation', deleteEmailTemplate: boolean };

export type ArchiveEmployeeAbsenceCategoryMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ArchiveEmployeeAbsenceCategoryMutation = { __typename?: 'Mutation', archiveEmployeeAbsenceCategory: boolean };

export type CreateEmployeeAbsenceCategoryMutationVariables = Exact<{
  input: CreateEmployeeAbsenceCategoryInput;
}>;


export type CreateEmployeeAbsenceCategoryMutation = { __typename?: 'Mutation', createEmployeeAbsenceCategory: { __typename?: 'EmployeeAbsenceCategory', id: string } };

export type EmployeeAbsenceCategoriesByOrgIdFullQueryVariables = Exact<{ [key: string]: never; }>;


export type EmployeeAbsenceCategoriesByOrgIdFullQuery = { __typename?: 'Query', employeeAbsenceCategoriesByOrgId: Array<{ __typename?: 'EmployeeAbsenceCategory', id: string, systemCode?: SystemEmployeeAbsenceCategory | null, isSystem: boolean, isActive: boolean, countsAsWorkTime: boolean, isPaid: boolean, affectsVacationBalance: boolean, defaultIsVacationCapable: boolean, reducesVacationEntitlementAfterDays?: number | null, requiresCertificate: boolean, certificateRequiredFromDay?: number | null, maxDaysPerYear?: number | null, defaultPercentage: number, requiresApproval: boolean, color?: string | null, iconName?: string | null, sortOrder: number, translations?: Array<{ __typename?: 'EmployeeAbsenceCategoryTranslation', locale: Locale, name: string, description?: string | null }> | null }> };

export type EmployeeAbsenceCategoryByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type EmployeeAbsenceCategoryByIdQuery = { __typename?: 'Query', employeeAbsenceCategoryById: { __typename?: 'EmployeeAbsenceCategory', id: string, systemCode?: SystemEmployeeAbsenceCategory | null, isSystem: boolean, isActive: boolean, countsAsWorkTime: boolean, isPaid: boolean, affectsVacationBalance: boolean, defaultIsVacationCapable: boolean, reducesVacationEntitlementAfterDays?: number | null, requiresCertificate: boolean, certificateRequiredFromDay?: number | null, maxDaysPerYear?: number | null, defaultPercentage: number, requiresApproval: boolean, color?: string | null, iconName?: string | null, sortOrder: number, translations?: Array<{ __typename?: 'EmployeeAbsenceCategoryTranslation', locale: Locale, name: string, description?: string | null }> | null } };

export type ReorderEmployeeAbsenceCategoriesMutationVariables = Exact<{
  ids: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type ReorderEmployeeAbsenceCategoriesMutation = { __typename?: 'Mutation', reorderEmployeeAbsenceCategories: Array<{ __typename?: 'EmployeeAbsenceCategory', id: string, sortOrder: number }> };

export type SetEmployeeAbsenceCategoryActiveMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  isActive: Scalars['Boolean']['input'];
}>;


export type SetEmployeeAbsenceCategoryActiveMutation = { __typename?: 'Mutation', setEmployeeAbsenceCategoryActive: { __typename?: 'EmployeeAbsenceCategory', id: string, isActive: boolean } };

export type UpdateEmployeeAbsenceCategoryMutationVariables = Exact<{
  input: UpdateEmployeeAbsenceCategoryInput;
}>;


export type UpdateEmployeeAbsenceCategoryMutation = { __typename?: 'Mutation', updateEmployeeAbsenceCategory: { __typename?: 'EmployeeAbsenceCategory', id: string } };

export type CreateEmployeeAbsenceNoticeMutationVariables = Exact<{
  createEmployeeAbsenceInput: CreateEmployeeAbsenceNoticeInput;
}>;


export type CreateEmployeeAbsenceNoticeMutation = { __typename?: 'Mutation', createEmployeeAbsenceNotice: { __typename?: 'EmployeeAbsence', id: string } };

export type GetEmployeeAbsenceCategoriesByOrgIdQueryVariables = Exact<{ [key: string]: never; }>;


export type GetEmployeeAbsenceCategoriesByOrgIdQuery = { __typename?: 'Query', employeeAbsenceCategoriesByOrgId: Array<{ __typename?: 'EmployeeAbsenceCategory', id: string, systemCode?: SystemEmployeeAbsenceCategory | null }> };

export type CreateEmployeeNoteMutationVariables = Exact<{
  createEmployeeNoteInput: CreateEmployeeNoteInput;
}>;


export type CreateEmployeeNoteMutation = { __typename?: 'Mutation', createEmployeeNote: { __typename?: 'EmployeeNote', id: string } };

export type GetEmployeeNotesByEmployeeIdQueryVariables = Exact<{
  employeeId: Scalars['ID']['input'];
}>;


export type GetEmployeeNotesByEmployeeIdQuery = { __typename?: 'Query', employeeNotesByEmployeeId: Array<{ __typename?: 'EmployeeNote', id: string, category: EmployeeNoteCategory, title: string, content: string, isConfidential: boolean, date: string, createdAt: any, authorMembership?: { __typename?: 'Membership', id: string, user?: { __typename?: 'User', firstName: string, lastName: string } | null } | null }> };

export type CreateEmployeeMutationVariables = Exact<{
  createEmployeeInput: CreateEmployeeInput;
}>;


export type CreateEmployeeMutation = { __typename?: 'Mutation', createEmployee: { __typename?: 'Employee', id: string } };

export type EmployeeContractsByEmployeeIdQueryVariables = Exact<{
  employeeId: Scalars['ID']['input'];
}>;


export type EmployeeContractsByEmployeeIdQuery = { __typename?: 'Query', employeeContractsByEmployeeId: Array<{ __typename?: 'EmployeeContract', id: string, employeeId: string, startDate: string, endDate?: string | null, probationEndDate?: string | null, contractType?: EmployeeContractType | null, position?: string | null, supervisorMembershipId?: string | null, workloadPercent?: number | null, weeklyHours?: string | null, grossSalary?: number | null, paymentInterval?: EmployeePaymentInterval | null, has13thSalary?: boolean | null, annualVacationDays?: number | null, remainingVacationDays?: string | null, notes?: string | null, documentUrl?: string | null, isActive: boolean }> };

export type CreateEmployeeContractMutationVariables = Exact<{
  input: CreateEmployeeContractInput;
}>;


export type CreateEmployeeContractMutation = { __typename?: 'Mutation', createEmployeeContract: { __typename?: 'EmployeeContract', id: string } };

export type UpdateEmployeeContractMutationVariables = Exact<{
  input: UpdateEmployeeContractInput;
}>;


export type UpdateEmployeeContractMutation = { __typename?: 'Mutation', updateEmployeeContract: { __typename?: 'EmployeeContract', id: string } };

export type DeleteEmployeeContractMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteEmployeeContractMutation = { __typename?: 'Mutation', deleteEmployeeContract: boolean };

export type UpsertEmployeeOnboardingDraftMutationVariables = Exact<{
  input: EmployeeOnboardingInput;
}>;


export type UpsertEmployeeOnboardingDraftMutation = { __typename?: 'Mutation', upsertEmployeeOnboardingDraft: { __typename?: 'Employee', id: string, status: EmployeeStatus, invitationStatus: EmployeeInvitationStatus } };

export type FinalizeEmployeeOnboardingMutationVariables = Exact<{
  input: FinalizeEmployeeOnboardingInput;
}>;


export type FinalizeEmployeeOnboardingMutation = { __typename?: 'Mutation', finalizeEmployeeOnboarding: { __typename?: 'Employee', id: string, status: EmployeeStatus, invitationStatus: EmployeeInvitationStatus } };

export type SendEmployeeInvitationMutationVariables = Exact<{
  employeeId: Scalars['ID']['input'];
}>;


export type SendEmployeeInvitationMutation = { __typename?: 'Mutation', sendEmployeeInvitation: { __typename?: 'Employee', id: string, invitationStatus: EmployeeInvitationStatus } };

export type GetEmployeeAuditLogQueryVariables = Exact<{
  employeeId: Scalars['ID']['input'];
}>;


export type GetEmployeeAuditLogQuery = { __typename?: 'Query', employeeAuditLog: Array<{ __typename?: 'EmployeeAuditLog', id: string, createdAt: any, entityType: EmployeeAuditLogEntityType, fieldName: string, oldValue?: string | null, newValue?: string | null, actorMembershipId?: string | null, actorMembership?: { __typename?: 'Membership', id: string, user?: { __typename?: 'User', id: string, firstName: string, lastName: string } | null } | null }> };

export type GetEmployeeByIdQueryVariables = Exact<{
  employeeId: Scalars['ID']['input'];
}>;


export type GetEmployeeByIdQuery = { __typename?: 'Query', employeeById: { __typename?: 'Employee', id: string, timeTrackingEnabled: boolean, membership: { __typename?: 'Membership', id: string, persona: Persona, contactPhone?: string | null, user?: { __typename?: 'User', id: string, title?: string | null, firstName: string, lastName: string, dateOfBirth?: string | null, socialSecurityNumber?: string | null, street?: string | null, houseNumber?: string | null, addressLine2?: string | null, postalCode?: string | null, city?: string | null, country?: string | null, userEmails: Array<{ __typename?: 'UserEmail', email: string, isPrimary: boolean }> } | null, organization: { __typename?: 'Organization', id: string, name?: string | null }, roles?: Array<{ __typename?: 'Role', id: string, name?: string | null, systemCode?: SystemRole | null }> | null } } };

export type GetEmployeeEmergencyProfileQueryVariables = Exact<{
  employeeId: Scalars['ID']['input'];
}>;


export type GetEmployeeEmergencyProfileQuery = { __typename?: 'Query', employeeEmergencyProfile?: { __typename?: 'EmployeeEmergencyProfile', id: string, employeeId: string, contact1Name?: string | null, contact1Relationship?: EmergencyContactRelationship | null, contact1Phone?: string | null, contact1Email?: string | null, contact2Name?: string | null, contact2Relationship?: EmergencyContactRelationship | null, contact2Phone?: string | null, contact2Email?: string | null, bloodType?: BloodType | null, allergies?: string | null, chronicConditions?: string | null, emergencyMedications?: string | null, primaryDoctorName?: string | null, primaryDoctorPhone?: string | null, pharmacyName?: string | null } | null };

export type GetEmployeeHrProfileQueryVariables = Exact<{
  employeeId: Scalars['ID']['input'];
}>;


export type GetEmployeeHrProfileQuery = { __typename?: 'Query', employeeHrProfile?: { __typename?: 'EmployeeHrProfile', id: string, employeeId: string, iban?: string | null, bankAccountHolder?: string | null, bankName?: string | null, bvgInsuranceNumber?: string | null, withholdingTaxCode?: string | null, nationality?: string | null, residencePermitType?: EmployeeResidencePermitType | null, residencePermitValidUntil?: string | null, maritalStatus?: EmployeeMaritalStatus | null, denomination?: string | null, numberOfChildren?: number | null, onboardingStatus?: EmployeeOnboardingStatus | null, ndaSigned?: boolean | null, criminalRecordSubmitted?: boolean | null } | null };

export type GetEmployeesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetEmployeesQuery = { __typename?: 'Query', employeesByOrgId: Array<{ __typename?: 'Employee', workloadPercent?: number | null, timeBalanceMinutes?: number | null, membership: { __typename?: 'Membership', persona: Persona, contactPhone?: string | null, employee?: { __typename?: 'Employee', isActive: boolean, timeTrackingEnabled: boolean, id: string, status: EmployeeStatus, invitationStatus: EmployeeInvitationStatus } | null, user?: { __typename?: 'User', firstName: string, id: string, lastName: string, userEmails: Array<{ __typename?: 'UserEmail', email: string, isPrimary: boolean }> } | null }, teamMembers?: Array<{ __typename?: 'TeamMember', team?: { __typename?: 'Team', id: string, name: string } | null }> | null }> };

export type UpdateEmployeeMutationVariables = Exact<{
  updateEmployeeInput: UpdateEmployeeInput;
}>;


export type UpdateEmployeeMutation = { __typename?: 'Mutation', updateEmployee: { __typename?: 'Employee', id: string } };

export type UpsertEmployeeEmergencyProfileMutationVariables = Exact<{
  input: UpsertEmployeeEmergencyProfileInput;
}>;


export type UpsertEmployeeEmergencyProfileMutation = { __typename?: 'Mutation', upsertEmployeeEmergencyProfile: { __typename?: 'EmployeeEmergencyProfile', id: string } };

export type UpsertEmployeeHrProfileMutationVariables = Exact<{
  input: UpsertEmployeeHrProfileInput;
}>;


export type UpsertEmployeeHrProfileMutation = { __typename?: 'Mutation', upsertEmployeeHrProfile: { __typename?: 'EmployeeHrProfile', id: string } };

export type FamiliesQueryVariables = Exact<{ [key: string]: never; }>;


export type FamiliesQuery = { __typename?: 'Query', families: Array<{ __typename?: 'Family', id: string, name?: string | null, contactPersons: Array<{ __typename?: 'ContactPerson', firstName: string, lastName: string }> }> };

export type CreateGradeLevelMutationVariables = Exact<{
  input: CreateGradeLevelInput;
}>;


export type CreateGradeLevelMutation = { __typename?: 'Mutation', createGradeLevel: { __typename?: 'GradeLevel', id: string, name: string, parentId?: string | null, color?: string | null, shortCode?: string | null, ageMin?: number | null, ageMax?: number | null, sortOrder: number } };

export type DeleteGradeLevelMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteGradeLevelMutation = { __typename?: 'Mutation', deleteGradeLevel: boolean };

export type GetGradeLevelsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetGradeLevelsQuery = { __typename?: 'Query', gradeLevelsByOrgId: Array<{ __typename?: 'GradeLevel', id: string, name: string, parentId?: string | null, color?: string | null, shortCode?: string | null, ageMin?: number | null, ageMax?: number | null, sortOrder: number, classCount?: number | null, studentCount?: number | null }> };

export type ReorderGradeLevelsMutationVariables = Exact<{
  input: ReorderGradeLevelsInput;
}>;


export type ReorderGradeLevelsMutation = { __typename?: 'Mutation', reorderGradeLevels: Array<{ __typename?: 'GradeLevel', id: string, name: string, parentId?: string | null, sortOrder: number }> };

export type UpdateGradeLevelMutationVariables = Exact<{
  input: UpdateGradeLevelInput;
}>;


export type UpdateGradeLevelMutation = { __typename?: 'Mutation', updateGradeLevel: { __typename?: 'GradeLevel', id: string, name: string, parentId?: string | null, color?: string | null, shortCode?: string | null, ageMin?: number | null, ageMax?: number | null, sortOrder: number } };

export type CreateOrganizationSettingMutationVariables = Exact<{
  input: CreateOrganizationSettingInput;
}>;


export type CreateOrganizationSettingMutation = { __typename?: 'Mutation', createOrganizationSetting: { __typename?: 'OrganizationSettingOutput', id: string, key: string, description?: string | null, hasValue: boolean } };

export type DeleteOrganizationSettingMutationVariables = Exact<{
  organizationId: Scalars['ID']['input'];
  key: Scalars['String']['input'];
}>;


export type DeleteOrganizationSettingMutation = { __typename?: 'Mutation', deleteOrganizationSetting: boolean };

export type GetOrganizationSettingQueryVariables = Exact<{
  organizationId: Scalars['ID']['input'];
  key: Scalars['String']['input'];
  decrypt: Scalars['Boolean']['input'];
}>;


export type GetOrganizationSettingQuery = { __typename?: 'Query', organizationSetting: { __typename?: 'OrganizationSettingOutput', id: string, organizationId: string, key: string, description?: string | null, hasValue: boolean, value?: string | null, version: number, createdAt: any, updatedAt: any } };

export type GetOrganizationSettingsQueryVariables = Exact<{
  organizationId: Scalars['ID']['input'];
}>;


export type GetOrganizationSettingsQuery = { __typename?: 'Query', organizationSettings: Array<{ __typename?: 'OrganizationSettingOutput', id: string, organizationId: string, key: string, description?: string | null, hasValue: boolean, version: number, createdAt: any, updatedAt: any }> };

export type UpdateOrganizationSettingMutationVariables = Exact<{
  input: UpdateOrganizationSettingInput;
}>;


export type UpdateOrganizationSettingMutation = { __typename?: 'Mutation', updateOrganizationSetting: { __typename?: 'OrganizationSettingOutput', id: string, key: string, description?: string | null, hasValue: boolean } };

export type IsOrganizationDomainAvailableQueryVariables = Exact<{
  domain: Scalars['String']['input'];
}>;


export type IsOrganizationDomainAvailableQuery = { __typename?: 'Query', isOrganizationDomainAvailable: boolean };

export type IsOrganizationSubdomainAvailableQueryVariables = Exact<{
  subdomain: Scalars['String']['input'];
}>;


export type IsOrganizationSubdomainAvailableQuery = { __typename?: 'Query', isOrganizationSubdomainAvailable: boolean };

export type CreateOrganizationMutationVariables = Exact<{ [key: string]: never; }>;


export type CreateOrganizationMutation = { __typename?: 'Mutation', createOrganization: { __typename?: 'Organization', id: string } };

export type OrganizationQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type OrganizationQuery = { __typename?: 'Query', organization: { __typename?: 'Organization', id: string, name?: string | null, subdomain?: string | null, domain?: string | null, street?: string | null, zip?: string | null, city?: string | null, country?: string | null, phone?: string | null, email?: string | null, website?: string | null, timezone: string, latitude?: number | null, longitude?: number | null, isActive: boolean, bvgProvider?: string | null, bvgContactPhone?: string | null, uvgProvider?: string | null, uvgContactPhone?: string | null, dailySicknessProvider?: string | null, dailySicknessContactPhone?: string | null, createdAt: any, updatedAt: any } };

export type GetOrganizationsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetOrganizationsQuery = { __typename?: 'Query', organizations: Array<{ __typename?: 'Organization', id: string, name?: string | null, subdomain?: string | null, domain?: string | null, isActive: boolean }> };

export type RemoveOrganizationMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type RemoveOrganizationMutation = { __typename?: 'Mutation', removeOrganization: { __typename?: 'Organization', id: string } };

export type UpdateOrganizationMutationVariables = Exact<{
  updateOrganizationInput: UpdateOrganizationInput;
}>;


export type UpdateOrganizationMutation = { __typename?: 'Mutation', updateOrganization: { __typename?: 'Organization', id: string, name?: string | null, subdomain?: string | null } };

export type AddTaskNoteMutationVariables = Exact<{
  input: AddTaskNoteInput;
}>;


export type AddTaskNoteMutation = { __typename?: 'Mutation', addTaskNote: { __typename?: 'Task', id: string, notes: Array<{ __typename?: 'TaskNote', id: string, text: string, authorName?: string | null, createdAt: string }> } };

export type ArchiveProjectMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  archived: Scalars['Boolean']['input'];
}>;


export type ArchiveProjectMutation = { __typename?: 'Mutation', archiveProject: { __typename?: 'Project', id: string, isArchived: boolean } };

export type CreateProjectFromTemplateMutationVariables = Exact<{
  input: CreateProjectFromTemplateInput;
}>;


export type CreateProjectFromTemplateMutation = { __typename?: 'Mutation', createProjectFromTemplate: { __typename?: 'Project', id: string } };

export type CreateProjectMutationVariables = Exact<{
  input: CreateProjectInput;
}>;


export type CreateProjectMutation = { __typename?: 'Mutation', createProject: { __typename?: 'Project', id: string } };

export type CreateTasksFromProtocolMutationVariables = Exact<{
  input: CreateTasksFromProtocolInput;
}>;


export type CreateTasksFromProtocolMutation = { __typename?: 'Mutation', createTasksFromProtocol: Array<{ __typename?: 'Task', id: string }> };

export type DeleteProjectMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteProjectMutation = { __typename?: 'Mutation', deleteProject: boolean };

export type MyTasksQueryVariables = Exact<{ [key: string]: never; }>;


export type MyTasksQuery = { __typename?: 'Query', myTasks: Array<{ __typename?: 'Task', id: string, title: string, description?: string | null, status: TaskStatus, priority: TaskPriority, dueDate?: string | null, dueTime?: string | null, completedAt?: any | null, createdByMembershipId?: string | null, sortOrder: number, admissionApplicationId?: string | null, checklist: Array<{ __typename?: 'TaskChecklistItem', id: string, label: string, done: boolean }>, notes: Array<{ __typename?: 'TaskNote', id: string, text: string, authorName?: string | null, createdAt: string }>, project?: { __typename?: 'Project', id: string, title: string, color?: string | null } | null, protocol?: { __typename?: 'Protocol', id: string, title: string } | null, admissionApplication?: { __typename?: 'AdmissionApplication', id: string, childFirstName: string, childLastName: string } | null, assignees?: Array<{ __typename?: 'TaskAssignee', id: string, membershipId: string, membership?: { __typename?: 'Membership', id: string, userId: string, user?: { __typename?: 'User', firstName: string, lastName: string } | null, userEmail?: { __typename?: 'UserEmail', email: string } | null } | null }> | null }> };

export type MembershipsByOrgIdQueryVariables = Exact<{
  organizationId: Scalars['ID']['input'];
}>;


export type MembershipsByOrgIdQuery = { __typename?: 'Query', membershipsByOrgId: Array<{ __typename?: 'Membership', id: string, userId: string, user?: { __typename?: 'User', firstName: string, lastName: string, isSuperAdmin?: boolean | null } | null, userEmail?: { __typename?: 'UserEmail', email: string } | null }> };

export type TasksByProjectQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type TasksByProjectQuery = { __typename?: 'Query', tasksByProject: Array<{ __typename?: 'Task', id: string, title: string, description?: string | null, status: TaskStatus, priority: TaskPriority, dueDate?: string | null, dueTime?: string | null, completedAt?: any | null, createdByMembershipId?: string | null, sortOrder: number, checklist: Array<{ __typename?: 'TaskChecklistItem', id: string, label: string, done: boolean }>, notes: Array<{ __typename?: 'TaskNote', id: string, text: string, authorName?: string | null, createdAt: string }>, protocol?: { __typename?: 'Protocol', id: string, title: string } | null, assignees?: Array<{ __typename?: 'TaskAssignee', id: string, membershipId: string, membership?: { __typename?: 'Membership', id: string, userId: string, user?: { __typename?: 'User', firstName: string, lastName: string } | null, userEmail?: { __typename?: 'UserEmail', email: string } | null } | null }> | null }> };

export type ProjectByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ProjectByIdQuery = { __typename?: 'Query', projectById: { __typename?: 'Project', id: string, title: string, description?: string | null, status: ProjectStatus, color?: string | null, dueDate?: string | null, isArchived: boolean, createdAt: any, taskStats: { __typename?: 'ProjectTaskStats', total: number, done: number }, members?: Array<{ __typename?: 'ProjectMember', id: string, role: ProjectMemberRole, membership?: { __typename?: 'Membership', id: string, userId: string, user?: { __typename?: 'User', firstName: string, lastName: string } | null, userEmail?: { __typename?: 'UserEmail', email: string } | null } | null }> | null } };

export type MyProjectsQueryVariables = Exact<{ [key: string]: never; }>;


export type MyProjectsQuery = { __typename?: 'Query', myProjects: Array<{ __typename?: 'Project', id: string, title: string, description?: string | null, status: ProjectStatus, color?: string | null, dueDate?: string | null, isArchived: boolean, createdAt: any, taskStats: { __typename?: 'ProjectTaskStats', total: number, done: number }, members?: Array<{ __typename?: 'ProjectMember', id: string, role: ProjectMemberRole, membership?: { __typename?: 'Membership', id: string, user?: { __typename?: 'User', firstName: string, lastName: string } | null, userEmail?: { __typename?: 'UserEmail', email: string } | null } | null }> | null }> };

export type TasksByProtocolQueryVariables = Exact<{
  protocolId: Scalars['ID']['input'];
}>;


export type TasksByProtocolQuery = { __typename?: 'Query', tasksByProtocol: Array<{ __typename?: 'Task', id: string, title: string, description?: string | null, status: TaskStatus, priority: TaskPriority, dueDate?: string | null, project?: { __typename?: 'Project', id: string, title: string } | null, assignees?: Array<{ __typename?: 'TaskAssignee', id: string, membershipId: string, membership?: { __typename?: 'Membership', id: string, user?: { __typename?: 'User', firstName: string, lastName: string } | null, userEmail?: { __typename?: 'UserEmail', email: string } | null } | null }> | null }> };

export type ProtocolTemplatesByOrgQueryVariables = Exact<{ [key: string]: never; }>;


export type ProtocolTemplatesByOrgQuery = { __typename?: 'Query', protocolTemplatesByOrg: Array<{ __typename?: 'ProtocolTemplate', id: string, title: string, defaultParticipantMembershipIds: Array<string>, usedCount: number, agendaItems: Array<{ __typename?: 'AgendaItem', no?: number | null, topic: string, goal?: AgendaGoal | null }> }> };

export type ProtocolByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ProtocolByIdQuery = { __typename?: 'Query', protocolById: { __typename?: 'Protocol', id: string, title: string, meetingDate?: string | null, startTime?: string | null, endTime?: string | null, status: ProtocolStatus, projectId?: string | null, externalParticipants: Array<string>, createdByMembershipId?: string | null, createdBy?: { __typename?: 'Membership', userId: string } | null, project?: { __typename?: 'Project', id: string, title: string } | null, participants?: Array<{ __typename?: 'ProtocolParticipant', id: string, membershipId: string, membership?: { __typename?: 'Membership', id: string, userId: string, user?: { __typename?: 'User', firstName: string, lastName: string } | null, userEmail?: { __typename?: 'UserEmail', email: string } | null } | null }> | null, sections: { __typename?: 'ProtocolSections', infoPoints: Array<string>, agendaItems: Array<{ __typename?: 'AgendaItem', no?: number | null, topic: string, goal?: AgendaGoal | null }>, decisions: Array<{ __typename?: 'ProtocolDecision', topic: string, decision?: string | null, responsible?: string | null, dueDate?: string | null }>, communications: Array<{ __typename?: 'ProtocolCommunication', topic: string, audience?: string | null, responsible?: string | null, channel?: string | null, dueDate?: string | null }>, challenges: Array<{ __typename?: 'ProtocolChallenge', topic: string, challenge?: string | null, supportNeeded?: string | null }>, openPoints: Array<{ __typename?: 'ProtocolOpenPoint', topic: string, nextStep?: string | null, forNextMeeting: boolean }> } } };

export type ProtocolsByOrgQueryVariables = Exact<{ [key: string]: never; }>;


export type ProtocolsByOrgQuery = { __typename?: 'Query', protocolsByOrg: Array<{ __typename?: 'Protocol', id: string, title: string, meetingDate?: string | null, startTime?: string | null, endTime?: string | null, status: ProtocolStatus, project?: { __typename?: 'Project', id: string, title: string } | null, participants?: Array<{ __typename?: 'ProtocolParticipant', id: string }> | null }> };

export type ProjectTemplateByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ProjectTemplateByIdQuery = { __typename?: 'Query', projectTemplateById: { __typename?: 'ProjectTemplate', id: string, title: string, description?: string | null, createdAt: any, tasks?: Array<{ __typename?: 'ProjectTemplateTask', id: string, title: string, description?: string | null, priority: TaskPriority, sortOrder: number, dueOffsetDays?: number | null }> | null } };

export type ProjectTemplatesQueryVariables = Exact<{ [key: string]: never; }>;


export type ProjectTemplatesQuery = { __typename?: 'Query', projectTemplates: Array<{ __typename?: 'ProjectTemplate', id: string, title: string, description?: string | null, createdAt: any, tasks?: Array<{ __typename?: 'ProjectTemplateTask', id: string }> | null }> };

export type AddProjectMemberMutationVariables = Exact<{
  input: AddProjectMemberInput;
}>;


export type AddProjectMemberMutation = { __typename?: 'Mutation', addProjectMember: { __typename?: 'ProjectMember', id: string } };

export type UpdateProjectMemberRoleMutationVariables = Exact<{
  input: UpdateProjectMemberRoleInput;
}>;


export type UpdateProjectMemberRoleMutation = { __typename?: 'Mutation', updateProjectMemberRole: { __typename?: 'ProjectMember', id: string, role: ProjectMemberRole } };

export type RemoveProjectMemberMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RemoveProjectMemberMutation = { __typename?: 'Mutation', removeProjectMember: boolean };

export type CreateProtocolTemplateMutationVariables = Exact<{
  input: CreateProtocolTemplateInput;
}>;


export type CreateProtocolTemplateMutation = { __typename?: 'Mutation', createProtocolTemplate: { __typename?: 'ProtocolTemplate', id: string, title: string, defaultParticipantMembershipIds: Array<string>, usedCount: number, agendaItems: Array<{ __typename?: 'AgendaItem', no?: number | null, topic: string, goal?: AgendaGoal | null }> } };

export type UpdateProtocolTemplateMutationVariables = Exact<{
  input: UpdateProtocolTemplateInput;
}>;


export type UpdateProtocolTemplateMutation = { __typename?: 'Mutation', updateProtocolTemplate: { __typename?: 'ProtocolTemplate', id: string } };

export type DeleteProtocolTemplateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteProtocolTemplateMutation = { __typename?: 'Mutation', deleteProtocolTemplate: boolean };

export type SaveProtocolAsTemplateMutationVariables = Exact<{
  input: SaveProtocolAsTemplateInput;
}>;


export type SaveProtocolAsTemplateMutation = { __typename?: 'Mutation', saveProtocolAsTemplate: { __typename?: 'ProtocolTemplate', id: string } };

export type CreateProtocolMutationVariables = Exact<{
  input: CreateProtocolInput;
}>;


export type CreateProtocolMutation = { __typename?: 'Mutation', createProtocol: { __typename?: 'Protocol', id: string } };

export type UpdateProtocolMutationVariables = Exact<{
  input: UpdateProtocolInput;
}>;


export type UpdateProtocolMutation = { __typename?: 'Mutation', updateProtocol: { __typename?: 'Protocol', id: string } };

export type DeleteProtocolMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteProtocolMutation = { __typename?: 'Mutation', deleteProtocol: boolean };

export type CreateTaskMutationVariables = Exact<{
  input: CreateTaskInput;
}>;


export type CreateTaskMutation = { __typename?: 'Mutation', createTask: { __typename?: 'Task', id: string } };

export type UpdateTaskMutationVariables = Exact<{
  input: UpdateTaskInput;
}>;


export type UpdateTaskMutation = { __typename?: 'Mutation', updateTask: { __typename?: 'Task', id: string } };

export type MoveTaskMutationVariables = Exact<{
  input: MoveTaskInput;
}>;


export type MoveTaskMutation = { __typename?: 'Mutation', moveTask: { __typename?: 'Task', id: string, status: TaskStatus, sortOrder: number } };

export type DeleteTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteTaskMutation = { __typename?: 'Mutation', deleteTask: boolean };

export type CreateProjectTemplateMutationVariables = Exact<{
  input: CreateProjectTemplateInput;
}>;


export type CreateProjectTemplateMutation = { __typename?: 'Mutation', createProjectTemplate: { __typename?: 'ProjectTemplate', id: string } };

export type UpdateProjectTemplateMutationVariables = Exact<{
  input: UpdateProjectTemplateInput;
}>;


export type UpdateProjectTemplateMutation = { __typename?: 'Mutation', updateProjectTemplate: { __typename?: 'ProjectTemplate', id: string } };

export type DeleteProjectTemplateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteProjectTemplateMutation = { __typename?: 'Mutation', deleteProjectTemplate: boolean };

export type CreatePersonalTaskMutationVariables = Exact<{
  input: CreateTaskInput;
}>;


export type CreatePersonalTaskMutation = { __typename?: 'Mutation', createTask: { __typename?: 'Task', id: string } };

export type UpdatePersonalTaskMutationVariables = Exact<{
  input: UpdateTaskInput;
}>;


export type UpdatePersonalTaskMutation = { __typename?: 'Mutation', updateTask: { __typename?: 'Task', id: string } };

export type ReorderMyTasksMutationVariables = Exact<{
  orderedTaskIds: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type ReorderMyTasksMutation = { __typename?: 'Mutation', reorderMyTasks: boolean };

export type SaveProjectAsTemplateMutationVariables = Exact<{
  input: SaveProjectAsTemplateInput;
}>;


export type SaveProjectAsTemplateMutation = { __typename?: 'Mutation', saveProjectAsTemplate: { __typename?: 'ProjectTemplate', id: string } };

export type UpdateProjectMutationVariables = Exact<{
  input: UpdateProjectInput;
}>;


export type UpdateProjectMutation = { __typename?: 'Mutation', updateProject: { __typename?: 'Project', id: string } };

export type UpdateTaskStatusMutationVariables = Exact<{
  input: UpdateTaskInput;
}>;


export type UpdateTaskStatusMutation = { __typename?: 'Mutation', updateTask: { __typename?: 'Task', id: string, status: TaskStatus } };

export type GetRecordKeepingSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetRecordKeepingSettingsQuery = { __typename?: 'Query', recordKeepingSettings: { __typename?: 'RecordKeepingSettings', introducedStuckDays: number, practicedStuckDays: number, bigGapDays: number } };

export type UpdateRecordKeepingSettingsMutationVariables = Exact<{
  input: UpdateRecordKeepingSettingsInput;
}>;


export type UpdateRecordKeepingSettingsMutation = { __typename?: 'Mutation', updateRecordKeepingSettings: { __typename?: 'RecordKeepingSettings', introducedStuckDays: number, practicedStuckDays: number, bigGapDays: number } };

export type CreateLessonRecordsBulkMutationVariables = Exact<{
  input: CreateLessonRecordsBulkInput;
}>;


export type CreateLessonRecordsBulkMutation = { __typename?: 'Mutation', createLessonRecordsBulk: Array<{ __typename?: 'LessonRecord', id: string, studentId: string, lessonId: string, recordedAt: string, status: LessonRecordStatus, note?: string | null }> };

export type GetAreaLessonCountsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAreaLessonCountsQuery = { __typename?: 'Query', areaLessonCountsByOrg: Array<{ __typename?: 'AreaLessonCount', areaId: string, lessonCount: number, curriculumId?: string | null, curriculumName?: string | null }> };

export type ClassroomAttentionQueryVariables = Exact<{
  schoolClassId: Scalars['ID']['input'];
  locale: Scalars['String']['input'];
}>;


export type ClassroomAttentionQuery = { __typename?: 'Query', classroomAttentionSummaries: Array<{ __typename?: 'StudentAttentionSummaryOutput', studentId: string, firstName: string, lastName: string, totalSignals: number, byReason: { __typename?: 'AttentionReasonCounts', NEEDS_MORE_CURRENT: number, REPEATED_NEEDS_MORE: number, STUCK_PRACTICED: number, STUCK_INTRODUCED: number, BIG_GAP_INTRO_TO_PRACTICED: number }, topItems: Array<{ __typename?: 'AttentionItemOutput', lessonId: string, lessonName: string, reason: AttentionReason, severity: number, days?: number | null, since?: string | null, ancestors: Array<{ __typename?: 'AttentionAncestor', id: string, nodeType: string, translations: Array<{ __typename?: 'AttentionAncestorTranslation', locale: string, name: string }> }> }> }> };

export type ClassroomEngagementTimelineQueryVariables = Exact<{
  schoolClassId: Scalars['ID']['input'];
  from: Scalars['String']['input'];
  to: Scalars['String']['input'];
  granularity: TimelineGranularity;
}>;


export type ClassroomEngagementTimelineQuery = { __typename?: 'Query', classroomEngagementTimeline: { __typename?: 'EngagementTimelineOutput', totalObserved: number, buckets: Array<{ __typename?: 'EngagementTimelineBucketOutput', bucketStart: string, focused: number, interested: number, mechanical: number, resistant: number, total: number }> } };

export type ClassroomHeatmapDataQueryVariables = Exact<{
  schoolClassId: Scalars['ID']['input'];
  locale: Scalars['String']['input'];
}>;


export type ClassroomHeatmapDataQuery = { __typename?: 'Query', classroomHeatmapData: { __typename?: 'ClassroomHeatmapDataOutput', students: Array<{ __typename?: 'HeatmapStudentOutput', studentId: string, firstName: string, lastName: string }>, areas: Array<{ __typename?: 'HeatmapAreaOutput', areaId: string, areaName: string }>, cells: Array<{ __typename?: 'HeatmapCellOutput', studentId: string, areaId: string, status: LessonRecordStatus, count: number }> } };

export type GetClassroomStudentsQueryVariables = Exact<{
  schoolClassId: Scalars['ID']['input'];
}>;


export type GetClassroomStudentsQuery = { __typename?: 'Query', activeEnrollmentsBySchoolClassId: Array<{ __typename?: 'SchoolClassEnrollment', id: string, student: { __typename?: 'Student', id: string, firstName: string, lastName: string } }> };

export type GetLessonPrerequisitesQueryVariables = Exact<{
  lessonId: Scalars['ID']['input'];
}>;


export type GetLessonPrerequisitesQuery = { __typename?: 'Query', lessonPrerequisites: Array<{ __typename?: 'CurriculumNode', id: string, position: number, lessonType?: LessonType | null, lessonScale?: LessonScale | null, translations?: Array<{ __typename?: 'CurriculumNodeTranslation', locale: CurriculumLocale, name: string }> | null }> };

export type GetLessonsForRecordKeepingQueryVariables = Exact<{ [key: string]: never; }>;


export type GetLessonsForRecordKeepingQuery = { __typename?: 'Query', lessonsByOrg: Array<{ __typename?: 'CurriculumNode', id: string, position: number, lessonType?: LessonType | null, lessonScale?: LessonScale | null, translations?: Array<{ __typename?: 'CurriculumNodeTranslation', locale: CurriculumLocale, name: string }> | null, ancestors: Array<{ __typename?: 'CurriculumNode', id: string, nodeType: CurriculumNodeType, position: number, translations?: Array<{ __typename?: 'CurriculumNodeTranslation', locale: CurriculumLocale, name: string }> | null }> }> };

export type NextLessonsForStudentQueryVariables = Exact<{
  studentId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type NextLessonsForStudentQuery = { __typename?: 'Query', nextLessonsForStudent: Array<{ __typename?: 'CurriculumNode', id: string, position: number, lessonType?: LessonType | null, lessonScale?: LessonScale | null, translations?: Array<{ __typename?: 'CurriculumNodeTranslation', locale: CurriculumLocale, name: string }> | null }> };

export type GetOrgAreasQueryVariables = Exact<{ [key: string]: never; }>;


export type GetOrgAreasQuery = { __typename?: 'Query', areasByOrg: Array<{ __typename?: 'CurriculumNode', id: string, position: number, nodeType: CurriculumNodeType, translations?: Array<{ __typename?: 'CurriculumNodeTranslation', locale: CurriculumLocale, name: string }> | null }> };

export type GetStudentLessonRecordsQueryVariables = Exact<{
  filter?: InputMaybe<LessonRecordsFilterInput>;
}>;


export type GetStudentLessonRecordsQuery = { __typename?: 'Query', lessonRecords: Array<{ __typename?: 'LessonRecord', id: string, lessonId: string, recordedAt: string, status: LessonRecordStatus, note?: string | null, engagement?: LessonRecordEngagement | null, difficulty?: LessonRecordDifficulty | null, socialForm?: LessonRecordSocialForm | null, selfAssessment?: LessonRecordSelfAssessment | null, selfAssessmentByChild: boolean, lessonClarityConfirmed?: boolean | null, selfConfidence?: LessonRecordSelfConfidence | null, persistence?: LessonRecordPersistence | null, concentration?: LessonRecordConcentration | null, lesson?: { __typename?: 'CurriculumNode', id: string, position: number, translations?: Array<{ __typename?: 'CurriculumNodeTranslation', locale: CurriculumLocale, name: string }> | null, ancestors: Array<{ __typename?: 'CurriculumNode', id: string, nodeType: CurriculumNodeType, position: number, translations?: Array<{ __typename?: 'CurriculumNodeTranslation', locale: CurriculumLocale, name: string }> | null }> } | null, recordedBy?: { __typename?: 'User', id: string, firstName: string, lastName: string } | null }> };

export type StudentLessonRecordTimelineQueryVariables = Exact<{
  studentId: Scalars['ID']['input'];
  from: Scalars['String']['input'];
  to: Scalars['String']['input'];
  granularity: TimelineGranularity;
}>;


export type StudentLessonRecordTimelineQuery = { __typename?: 'Query', studentLessonRecordTimeline: { __typename?: 'StudentTimelineOutput', totalIntroductionsInRange: number, daysSinceLastIntroduction?: number | null, buckets: Array<{ __typename?: 'StudentTimelineBucketOutput', bucketStart: string, planning: number, introduced: number, practiced: number, mastered: number, needsMore: number, total: number }> } };

export type SetLessonPrerequisitesMutationVariables = Exact<{
  input: SetLessonPrerequisitesInput;
}>;


export type SetLessonPrerequisitesMutation = { __typename?: 'Mutation', setLessonPrerequisites: { __typename?: 'CurriculumNode', id: string } };

export type UpdateLessonRecordMutationVariables = Exact<{
  input: UpdateLessonRecordInput;
}>;


export type UpdateLessonRecordMutation = { __typename?: 'Mutation', updateLessonRecord: { __typename?: 'LessonRecord', id: string, studentId: string, lessonId: string, recordedAt: string, status: LessonRecordStatus, note?: string | null } };

export type DeleteRetentionPolicyMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteRetentionPolicyMutation = { __typename?: 'Mutation', deleteRetentionPolicy: boolean };

export type ExecutePurgeCandidateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ExecutePurgeCandidateMutation = { __typename?: 'Mutation', executePurgeCandidate: boolean };

export type PurgeCandidatesQueryVariables = Exact<{ [key: string]: never; }>;


export type PurgeCandidatesQuery = { __typename?: 'Query', purgeCandidates: Array<{ __typename?: 'PurgeCandidate', id: string, entityType: RetentionEntityType, subjectLabel: string, dueSince: any, action: RetentionAction, status: PurgeStatus, reviewedAt?: any | null, executedAt?: any | null, note?: string | null }> };

export type RetentionPoliciesQueryVariables = Exact<{ [key: string]: never; }>;


export type RetentionPoliciesQuery = { __typename?: 'Query', retentionPolicies: Array<{ __typename?: 'RetentionPolicy', id: string, entityType: RetentionEntityType, retentionMonths: number, action: RetentionAction, description?: string | null, isEnabled: boolean, dueCount?: number | null }> };

export type ReviewPurgeCandidateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  approve: Scalars['Boolean']['input'];
}>;


export type ReviewPurgeCandidateMutation = { __typename?: 'Mutation', reviewPurgeCandidate: boolean };

export type ScanRetentionMutationVariables = Exact<{ [key: string]: never; }>;


export type ScanRetentionMutation = { __typename?: 'Mutation', scanRetention: number };

export type UpsertRetentionPolicyMutationVariables = Exact<{
  input: UpsertRetentionPolicyInput;
}>;


export type UpsertRetentionPolicyMutation = { __typename?: 'Mutation', upsertRetentionPolicy: { __typename?: 'RetentionPolicy', id: string } };

export type GetPermissionsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetPermissionsQuery = { __typename?: 'Query', permissions: Array<{ __typename?: 'Permission', id: string, code: PermissionCode, name: string, description?: string | null }> };

export type GetRolesByOrgIdQueryVariables = Exact<{ [key: string]: never; }>;


export type GetRolesByOrgIdQuery = { __typename?: 'Query', rolesByOrgId: Array<{ __typename?: 'Role', id: string, name?: string | null, systemCode?: SystemRole | null, isSystem: boolean, permissions?: Array<{ __typename?: 'Permission', id: string, code: PermissionCode, name: string }> | null }> };

export type UpdateRolePermissionsMutationVariables = Exact<{
  input: UpdateRolePermissionsInput;
}>;


export type UpdateRolePermissionsMutation = { __typename?: 'Mutation', updateRolePermissions: { __typename?: 'Role', id: string, permissions?: Array<{ __typename?: 'Permission', id: string, code: PermissionCode }> | null } };

export type CreateSchoolClassMutationVariables = Exact<{
  input: CreateSchoolClassInput;
}>;


export type CreateSchoolClassMutation = { __typename?: 'Mutation', createSchoolClass: { __typename?: 'SchoolClass', id: string } };

export type DeleteSchoolClassMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteSchoolClassMutation = { __typename?: 'Mutation', deleteSchoolClass: boolean };

export type GetMyTeachingSchoolClassesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyTeachingSchoolClassesQuery = { __typename?: 'Query', myTeachingSchoolClasses: Array<{ __typename?: 'SchoolClass', id: string, name: string, color?: string | null, description?: string | null, sortOrder: number, maxCapacity?: number | null, room?: string | null, isActive: boolean, gradeLevels?: Array<{ __typename?: 'GradeLevel', id: string, name: string }> | null, teachers?: Array<{ __typename?: 'Employee', id: string, membership: { __typename?: 'Membership', user?: { __typename?: 'User', firstName: string, lastName: string } | null } }> | null }> };

export type GetSchoolClassByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetSchoolClassByIdQuery = { __typename?: 'Query', schoolClassById: { __typename?: 'SchoolClass', id: string, name: string, color?: string | null, description?: string | null, sortOrder: number, maxCapacity?: number | null, room?: string | null, isActive: boolean, gradeLevels?: Array<{ __typename?: 'GradeLevel', id: string, name: string }> | null, teachers?: Array<{ __typename?: 'Employee', id: string, membership: { __typename?: 'Membership', user?: { __typename?: 'User', firstName: string, lastName: string } | null } }> | null } };

export type GetSchoolClassesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSchoolClassesQuery = { __typename?: 'Query', schoolClassesByOrgId: Array<{ __typename?: 'SchoolClass', id: string, name: string, color?: string | null, description?: string | null, sortOrder: number, maxCapacity?: number | null, room?: string | null, enrolledCount?: number | null, isActive: boolean, gradeLevels?: Array<{ __typename?: 'GradeLevel', id: string, name: string, ageMin?: number | null, ageMax?: number | null }> | null, teachers?: Array<{ __typename?: 'Employee', id: string, membership: { __typename?: 'Membership', user?: { __typename?: 'User', firstName: string, lastName: string } | null } }> | null }> };

export type GetTeachersByOrgIdQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTeachersByOrgIdQuery = { __typename?: 'Query', teachersByOrgId: Array<{ __typename?: 'Employee', id: string, membership: { __typename?: 'Membership', user?: { __typename?: 'User', id: string, firstName: string, lastName: string } | null } }> };

export type ReorderSchoolClassesMutationVariables = Exact<{
  input: ReorderSchoolClassesInput;
}>;


export type ReorderSchoolClassesMutation = { __typename?: 'Mutation', reorderSchoolClasses: Array<{ __typename?: 'SchoolClass', id: string, name: string, sortOrder: number }> };

export type UpdateSchoolClassMutationVariables = Exact<{
  input: UpdateSchoolClassInput;
}>;


export type UpdateSchoolClassMutation = { __typename?: 'Mutation', updateSchoolClass: { __typename?: 'SchoolClass', id: string } };

export type CreateStudentNoteMutationVariables = Exact<{
  createStudentNoteInput: CreateStudentNoteInput;
}>;


export type CreateStudentNoteMutation = { __typename?: 'Mutation', createStudentNote: { __typename?: 'StudentNote', id: string } };

export type GetStudentNotesByStudentIdQueryVariables = Exact<{
  studentId: Scalars['ID']['input'];
}>;


export type GetStudentNotesByStudentIdQuery = { __typename?: 'Query', studentNotesByStudentId: Array<{ __typename?: 'StudentNote', id: string, category: StudentNoteCategory, title: string, content: string, isConfidential: boolean, date: string, createdAt: any, authorMembership?: { __typename?: 'Membership', id: string, user?: { __typename?: 'User', firstName: string, lastName: string } | null } | null }> };

export type KanbanSchoolClassesQueryVariables = Exact<{ [key: string]: never; }>;


export type KanbanSchoolClassesQuery = { __typename?: 'Query', schoolClassesByOrgId: Array<{ __typename?: 'SchoolClass', id: string, name: string, color?: string | null, maxCapacity?: number | null, sortOrder: number, isActive: boolean, gradeLevels?: Array<{ __typename?: 'GradeLevel', id: string, name: string }> | null }> };

export type KanbanUnassignedStudentsQueryVariables = Exact<{ [key: string]: never; }>;


export type KanbanUnassignedStudentsQuery = { __typename?: 'Query', unassignedStudents: Array<{ __typename?: 'Student', id: string, firstName: string, lastName: string }> };

export type KanbanClassroomStudentsQueryVariables = Exact<{
  schoolClassId: Scalars['ID']['input'];
}>;


export type KanbanClassroomStudentsQuery = { __typename?: 'Query', activeEnrollmentsBySchoolClassId: Array<{ __typename?: 'SchoolClassEnrollment', id: string, student: { __typename?: 'Student', id: string, firstName: string, lastName: string } }> };

export type TransferStudentMutationVariables = Exact<{
  input: TransferStudentInput;
}>;


export type TransferStudentMutation = { __typename?: 'Mutation', transferStudentToSchoolClass?: { __typename?: 'SchoolClassEnrollment', id: string } | null };

export type CreateStudentMutationVariables = Exact<{
  input: CreateStudentInput;
}>;


export type CreateStudentMutation = { __typename?: 'Mutation', createStudent: { __typename?: 'Student', id: string } };

export type DeleteStudentMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteStudentMutation = { __typename?: 'Mutation', deleteStudent: boolean };

export type GetStudentByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetStudentByIdQuery = { __typename?: 'Query', studentById: { __typename?: 'Student', id: string, firstName: string, lastName: string, dateOfBirth?: string | null, gender?: Gender | null, enrollmentDate?: string | null, exitDate?: string | null, notes?: string | null, isActive: boolean } };

export type GetEnrollmentsByStudentIdQueryVariables = Exact<{
  studentId: Scalars['ID']['input'];
}>;


export type GetEnrollmentsByStudentIdQuery = { __typename?: 'Query', enrollmentsByStudentId: Array<{ __typename?: 'SchoolClassEnrollment', id: string, enrolledAt: string, leftAt?: string | null, schoolClass: { __typename?: 'SchoolClass', id: string, name: string, gradeLevels?: Array<{ __typename?: 'GradeLevel', id: string, name: string }> | null } }> };

export type GetStudentsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetStudentsQuery = { __typename?: 'Query', studentsByOrgId: Array<{ __typename?: 'Student', id: string, firstName: string, lastName: string, dateOfBirth?: string | null, gender?: Gender | null, exitDate?: string | null, isActive: boolean, currentClass?: { __typename?: 'SchoolClass', id: string, name: string, color?: string | null, gradeLevels?: Array<{ __typename?: 'GradeLevel', id: string, name: string, color?: string | null }> | null } | null }> };

export type UpdateEnrollmentMutationVariables = Exact<{
  input: UpdateSchoolClassEnrollmentInput;
}>;


export type UpdateEnrollmentMutation = { __typename?: 'Mutation', updateEnrollment: { __typename?: 'SchoolClassEnrollment', id: string } };

export type UpdateStudentMutationVariables = Exact<{
  input: UpdateStudentInput;
}>;


export type UpdateStudentMutation = { __typename?: 'Mutation', updateStudent: { __typename?: 'Student', id: string } };

export type AddTeamMemberMutationVariables = Exact<{
  input: CreateTeamMemberInput;
}>;


export type AddTeamMemberMutation = { __typename?: 'Mutation', createTeamMember: { __typename?: 'TeamMember', id: string, role: TeamMemberRole } };

export type CreateTeamMutationVariables = Exact<{
  input: CreateTeamInput;
}>;


export type CreateTeamMutation = { __typename?: 'Mutation', createTeam: { __typename?: 'Team', id: string, name: string, sortOrder: number, parentId?: string | null } };

export type DeleteTeamMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteTeamMutation = { __typename?: 'Mutation', deleteTeam: boolean };

export type GetAllTeamMembersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAllTeamMembersQuery = { __typename?: 'Query', teamMembersByOrgId: Array<{ __typename?: 'TeamMember', id: string, role: TeamMemberRole, team?: { __typename?: 'Team', id: string } | null, employee?: { __typename?: 'Employee', id: string, isActive: boolean, membership: { __typename?: 'Membership', user?: { __typename?: 'User', id: string, firstName: string, lastName: string, userEmails: Array<{ __typename?: 'UserEmail', email: string, isPrimary: boolean }> } | null } } | null }> };

export type GetTeamByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetTeamByIdQuery = { __typename?: 'Query', teamById: { __typename?: 'Team', id: string, name: string } };

export type GetTeamMembersQueryVariables = Exact<{
  teamId: Scalars['ID']['input'];
}>;


export type GetTeamMembersQuery = { __typename?: 'Query', teamMembersByTeamId: Array<{ __typename?: 'TeamMember', id: string, role: TeamMemberRole, employee?: { __typename?: 'Employee', id: string, isActive: boolean, membership: { __typename?: 'Membership', user?: { __typename?: 'User', id: string, firstName: string, lastName: string, userEmails: Array<{ __typename?: 'UserEmail', email: string, isPrimary: boolean }> } | null } } | null }> };

export type GetTeamsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTeamsQuery = { __typename?: 'Query', teamsByOrgId: Array<{ __typename?: 'Team', id: string, name: string, sortOrder: number, parentId?: string | null }> };

export type MoveTeamMemberMutationVariables = Exact<{
  input: UpdateTeamMemberInput;
}>;


export type MoveTeamMemberMutation = { __typename?: 'Mutation', updateTeamMember: { __typename?: 'TeamMember', id: string, role: TeamMemberRole } };

export type RemoveTeamMemberMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RemoveTeamMemberMutation = { __typename?: 'Mutation', deleteTeamMember: boolean };

export type ReorderTeamsMutationVariables = Exact<{
  input: ReorderTeamsInput;
}>;


export type ReorderTeamsMutation = { __typename?: 'Mutation', reorderTeams: Array<{ __typename?: 'Team', id: string, name: string, sortOrder: number, parentId?: string | null }> };

export type UpdateTeamMemberRoleMutationVariables = Exact<{
  input: UpdateTeamMemberInput;
}>;


export type UpdateTeamMemberRoleMutation = { __typename?: 'Mutation', updateTeamMember: { __typename?: 'TeamMember', id: string, role: TeamMemberRole } };

export type UpdateTeamMutationVariables = Exact<{
  input: UpdateTeamInput;
}>;


export type UpdateTeamMutation = { __typename?: 'Mutation', updateTeam: { __typename?: 'Team', id: string, name: string } };

export type MyEmployeeIdQueryVariables = Exact<{ [key: string]: never; }>;


export type MyEmployeeIdQuery = { __typename?: 'Query', myEmployeeId?: string | null };

export type MyTimeTrackingQueryVariables = Exact<{
  employeeId: Scalars['ID']['input'];
  from: Scalars['String']['input'];
  to: Scalars['String']['input'];
}>;


export type MyTimeTrackingQuery = { __typename?: 'Query', myMissingRecordDays: Array<string>, myWorkTimeBalance: { __typename?: 'WorkTimeBalance', employeeId: string, fromDate: string, toDate: string, plannedMinutes: number, workedMinutes: number, vacationMinutes: number, absenceMinutes: number, actualMinutes: number, differenceMinutes: number, openingWorkMinutes: number, paidOvertimeMinutes: number, netBalanceMinutes: number, vacationDaysUsed: number, absenceDaysCount: number }, myVacationBalance: { __typename?: 'VacationBalance', entitlementDays: number, openingDays: number, usedDays: number, remainingDays: number }, timeTrackingByEmployeeId: Array<{ __typename?: 'TimeTracking', id: string, startedAt: any, endedAt?: any | null, breakMinutes?: number | null, workMinutes?: number | null, notes?: string | null, entryDate: string, source: TimeTrackingSource }> };

export type TeamOverviewQueryVariables = Exact<{
  from: Scalars['String']['input'];
  to: Scalars['String']['input'];
}>;


export type TeamOverviewQuery = { __typename?: 'Query', teamWorkTimeOverview: Array<{ __typename?: 'EmployeeWorkTimeOverviewRow', employeeId: string, employeeName?: string | null, netBalanceMinutes: number, vacationDaysUsed: number }> };

export type EmployeeReportQueryVariables = Exact<{
  employeeId: Scalars['ID']['input'];
  from: Scalars['String']['input'];
  to: Scalars['String']['input'];
  locale?: InputMaybe<Scalars['String']['input']>;
}>;


export type EmployeeReportQuery = { __typename?: 'Query', employeeMissingRecordDays: Array<string>, employeeAbsenceCategorySummary: Array<{ __typename?: 'AbsenceCategorySummary', categoryId: string, name?: string | null, color?: string | null, fullDays: number, partialDays: number, totalDays: number }>, employeeWorkTimeBalance: { __typename?: 'WorkTimeBalance', employeeId: string, plannedMinutes: number, workedMinutes: number, vacationMinutes: number, absenceMinutes: number, differenceMinutes: number, openingWorkMinutes: number, paidOvertimeMinutes: number, netBalanceMinutes: number, vacationDaysUsed: number, absenceDaysCount: number }, employeeVacationBalance: { __typename?: 'VacationBalance', entitlementDays: number, openingDays: number, usedDays: number, remainingDays: number }, employeeMonthlyWorkTime: Array<{ __typename?: 'MonthlyWorkTimeSummary', year: number, month: number, plannedMinutes: number, actualMinutes: number, differenceMinutes: number }> };

export type CreateTimeTrackingMutationVariables = Exact<{
  input: CreateTimeTrackingInput;
}>;


export type CreateTimeTrackingMutation = { __typename?: 'Mutation', createTimeTracking: { __typename?: 'TimeTracking', id: string } };

export type UpdateTimeTrackingMutationVariables = Exact<{
  input: UpdateTimeTrackingInput;
}>;


export type UpdateTimeTrackingMutation = { __typename?: 'Mutation', updateTimeTracking: { __typename?: 'TimeTracking', id: string } };

export type DeleteTimeTrackingMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteTimeTrackingMutation = { __typename?: 'Mutation', deleteTimeTracking: boolean };

export type StartTimeTrackingMutationVariables = Exact<{
  employeeId: Scalars['ID']['input'];
}>;


export type StartTimeTrackingMutation = { __typename?: 'Mutation', startTimeTracking: { __typename?: 'TimeTracking', id: string } };

export type StopTimeTrackingMutationVariables = Exact<{
  employeeId: Scalars['ID']['input'];
}>;


export type StopTimeTrackingMutation = { __typename?: 'Mutation', stopTimeTracking: { __typename?: 'TimeTracking', id: string } };

export type EmployeePeriodOpeningBalancesQueryVariables = Exact<{
  employeeId: Scalars['ID']['input'];
}>;


export type EmployeePeriodOpeningBalancesQuery = { __typename?: 'Query', employeePeriodOpeningBalances: Array<{ __typename?: 'EmployeePeriodOpeningBalance', id: string, employeeId: string, periodId: string, openingWorkMinutes: number, openingVacationDays: number }> };

export type UpsertEmployeePeriodOpeningBalanceMutationVariables = Exact<{
  input: UpsertEmployeePeriodOpeningBalanceInput;
}>;


export type UpsertEmployeePeriodOpeningBalanceMutation = { __typename?: 'Mutation', upsertEmployeePeriodOpeningBalance: { __typename?: 'EmployeePeriodOpeningBalance', id: string } };

export type DeleteEmployeePeriodOpeningBalanceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteEmployeePeriodOpeningBalanceMutation = { __typename?: 'Mutation', deleteEmployeePeriodOpeningBalance: boolean };

export type EmployeePaidOvertimeQueryVariables = Exact<{
  employeeId: Scalars['ID']['input'];
}>;


export type EmployeePaidOvertimeQuery = { __typename?: 'Query', employeePaidOvertime: Array<{ __typename?: 'EmployeePaidOvertime', id: string, employeeId: string, date: string, minutes: number, note?: string | null }> };

export type CreateEmployeePaidOvertimeMutationVariables = Exact<{
  input: CreateEmployeePaidOvertimeInput;
}>;


export type CreateEmployeePaidOvertimeMutation = { __typename?: 'Mutation', createEmployeePaidOvertime: { __typename?: 'EmployeePaidOvertime', id: string } };

export type UpdateEmployeePaidOvertimeMutationVariables = Exact<{
  input: UpdateEmployeePaidOvertimeInput;
}>;


export type UpdateEmployeePaidOvertimeMutation = { __typename?: 'Mutation', updateEmployeePaidOvertime: { __typename?: 'EmployeePaidOvertime', id: string } };

export type DeleteEmployeePaidOvertimeMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteEmployeePaidOvertimeMutation = { __typename?: 'Mutation', deleteEmployeePaidOvertime: boolean };

export type TimeTrackingPeriodsQueryVariables = Exact<{ [key: string]: never; }>;


export type TimeTrackingPeriodsQuery = { __typename?: 'Query', timeTrackingPeriods: Array<{ __typename?: 'TimeTrackingPeriod', id: string, label: string, startDate: string, endDate: string, status: TimeTrackingPeriodStatus }> };

export type EnsureTimeTrackingPeriodMutationVariables = Exact<{
  date: Scalars['String']['input'];
}>;


export type EnsureTimeTrackingPeriodMutation = { __typename?: 'Mutation', ensureTimeTrackingPeriod: { __typename?: 'TimeTrackingPeriod', id: string, label: string } };

export type SetTimeTrackingPeriodStatusMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  status: TimeTrackingPeriodStatus;
}>;


export type SetTimeTrackingPeriodStatusMutation = { __typename?: 'Mutation', setTimeTrackingPeriodStatus: { __typename?: 'TimeTrackingPeriod', id: string, status: TimeTrackingPeriodStatus } };

export type TimeTrackingSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type TimeTrackingSettingsQuery = { __typename?: 'Query', holidays: Array<{ __typename?: 'Holiday', id: string, date: string, name: string, paidPercentage: number, canton?: string | null }>, companyVacations: Array<{ __typename?: 'CompanyVacation', id: string, name: string, startDate: string, endDate: string, appliesToAll: boolean }> };

export type CreateHolidayMutationVariables = Exact<{
  input: CreateHolidayInput;
}>;


export type CreateHolidayMutation = { __typename?: 'Mutation', createHoliday: { __typename?: 'Holiday', id: string } };

export type DeleteHolidayMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteHolidayMutation = { __typename?: 'Mutation', deleteHoliday: boolean };

export type CreateCompanyVacationMutationVariables = Exact<{
  input: CreateCompanyVacationInput;
}>;


export type CreateCompanyVacationMutation = { __typename?: 'Mutation', createCompanyVacation: { __typename?: 'CompanyVacation', id: string } };

export type DeleteCompanyVacationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteCompanyVacationMutation = { __typename?: 'Mutation', deleteCompanyVacation: boolean };

export type AddUserEmailMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
  email: Scalars['String']['input'];
}>;


export type AddUserEmailMutation = { __typename?: 'Mutation', addUserEmail: { __typename?: 'UserEmail', id: string, email: string, isPrimary: boolean, isVerified: boolean } };

export type ChangeUserEmailMutationVariables = Exact<{
  input: ChangeUserEmailInput;
}>;


export type ChangeUserEmailMutation = { __typename?: 'Mutation', changeUserEmail: { __typename?: 'User', id: string, userEmails: Array<{ __typename?: 'UserEmail', id: string, email: string, isPrimary: boolean, isVerified: boolean }> } };

export type CreateUserMutationVariables = Exact<{
  createUserInput: CreateUserInput;
}>;


export type CreateUserMutation = { __typename?: 'Mutation', createUser: { __typename?: 'User', id: string } };

export type GetAuthContextQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAuthContextQuery = { __typename?: 'Query', authContext: { __typename?: 'AuthContextOutput', roles: Array<string>, permissions: Array<string>, orgId?: string | null, orgName?: string | null, persona?: Persona | null, theme?: string | null, isSuperAdmin: boolean, timeTrackingEnabled: boolean, isProjectMember: boolean, user: { __typename?: 'User', id: string, firstName: string, lastName: string, userEmails: Array<{ __typename?: 'UserEmail', id: string, email: string, isPrimary: boolean, isVerified: boolean }> } } };

export type RolesByOrganizationIdQueryVariables = Exact<{
  organizationId: Scalars['ID']['input'];
}>;


export type RolesByOrganizationIdQuery = { __typename?: 'Query', rolesByOrganizationId: Array<{ __typename?: 'Role', id: string, name?: string | null, systemCode?: SystemRole | null, isSystem: boolean }> };

export type GetUserByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetUserByIdQuery = { __typename?: 'Query', user: { __typename?: 'User', id: string, title?: string | null, firstName: string, lastName: string, username?: string | null, dateOfBirth?: string | null, isSuperAdmin?: boolean | null, isActive: boolean, userEmails: Array<{ __typename?: 'UserEmail', id: string, email: string, isPrimary: boolean, isVerified: boolean }>, memberships: Array<{ __typename?: 'Membership', id: string, persona: Persona, contactPhone?: string | null, userEmailId?: string | null, organization: { __typename?: 'Organization', id: string, name?: string | null } }> } };

export type GetUsersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetUsersQuery = { __typename?: 'Query', users: Array<{ __typename?: 'User', id: string, title?: string | null, firstName: string, lastName: string, isSuperAdmin?: boolean | null, isActive: boolean, userEmails: Array<{ __typename?: 'UserEmail', id: string, email: string, isPrimary: boolean, isVerified: boolean, authAccounts?: Array<{ __typename?: 'AuthAccount', id: string, provider: AuthProvider }> | null }>, memberships: Array<{ __typename?: 'Membership', id: string, persona: Persona, organization: { __typename?: 'Organization', id: string, name?: string | null } }> }> };

export type RemoveUserEmailMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RemoveUserEmailMutation = { __typename?: 'Mutation', removeUserEmail: { __typename?: 'UserEmail', id: string } };

export type SetPrimaryUserEmailMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type SetPrimaryUserEmailMutation = { __typename?: 'Mutation', setPrimaryUserEmail: { __typename?: 'UserEmail', id: string, isPrimary: boolean } };

export type UpdateMyThemeMutationVariables = Exact<{
  input: UpdateMyThemeInput;
}>;


export type UpdateMyThemeMutation = { __typename?: 'Mutation', updateMyTheme: boolean };

export type UpdateUserMutationVariables = Exact<{
  updateUserInput: UpdateUserInput;
}>;


export type UpdateUserMutation = { __typename?: 'Mutation', updateUser: { __typename?: 'User', id: string } };

export type ArchiveProcessingActivityMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ArchiveProcessingActivityMutation = { __typename?: 'Mutation', archiveProcessingActivity: boolean };

export type ArchiveSubprocessorMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ArchiveSubprocessorMutation = { __typename?: 'Mutation', archiveSubprocessor: boolean };

export type ProcessingActivitiesQueryVariables = Exact<{ [key: string]: never; }>;


export type ProcessingActivitiesQuery = { __typename?: 'Query', processingActivities: Array<{ __typename?: 'ProcessingActivity', id: string, name: string, purpose?: string | null, legalBasis: ConsentLegalBasis, dataCategories?: string | null, dataSubjects?: string | null, recipients?: string | null, retentionNote?: string | null }> };

export type SubprocessorsQueryVariables = Exact<{ [key: string]: never; }>;


export type SubprocessorsQuery = { __typename?: 'Query', subprocessors: Array<{ __typename?: 'Subprocessor', id: string, name: string, purpose?: string | null, country?: string | null, dpaSigned: boolean, url?: string | null, notes?: string | null }> };

export type CreateProcessingActivityMutationVariables = Exact<{
  input: CreateProcessingActivityInput;
}>;


export type CreateProcessingActivityMutation = { __typename?: 'Mutation', createProcessingActivity: { __typename?: 'ProcessingActivity', id: string } };

export type UpdateProcessingActivityMutationVariables = Exact<{
  input: UpdateProcessingActivityInput;
}>;


export type UpdateProcessingActivityMutation = { __typename?: 'Mutation', updateProcessingActivity: { __typename?: 'ProcessingActivity', id: string } };

export type CreateSubprocessorMutationVariables = Exact<{
  input: CreateSubprocessorInput;
}>;


export type CreateSubprocessorMutation = { __typename?: 'Mutation', createSubprocessor: { __typename?: 'Subprocessor', id: string } };

export type UpdateSubprocessorMutationVariables = Exact<{
  input: UpdateSubprocessorInput;
}>;


export type UpdateSubprocessorMutation = { __typename?: 'Mutation', updateSubprocessor: { __typename?: 'Subprocessor', id: string } };


export const AccessReviewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AccessReview"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessReview"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"membershipId"}},{"kind":"Field","name":{"kind":"Name","value":"memberName"}},{"kind":"Field","name":{"kind":"Name","value":"roles"}},{"kind":"Field","name":{"kind":"Name","value":"sensitivePermissions"}},{"kind":"Field","name":{"kind":"Name","value":"lastReviewedAt"}}]}}]}}]} as unknown as DocumentNode<AccessReviewQuery, AccessReviewQueryVariables>;
export const RecertifyAccessDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RecertifyAccess"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"membershipId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"note"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recertifyAccess"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"membershipId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"membershipId"}}},{"kind":"Argument","name":{"kind":"Name","value":"note"},"value":{"kind":"Variable","name":{"kind":"Name","value":"note"}}}]}]}}]} as unknown as DocumentNode<RecertifyAccessMutation, RecertifyAccessMutationVariables>;
export const ArchiveApplicationContactPersonDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchiveApplicationContactPerson"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archiveContactPerson"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<ArchiveApplicationContactPersonMutation, ArchiveApplicationContactPersonMutationVariables>;
export const ArchiveAdmissionApplicationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchiveAdmissionApplication"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archiveAdmissionApplication"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<ArchiveAdmissionApplicationMutation, ArchiveAdmissionApplicationMutationVariables>;
export const RejectAdmissionApplicationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RejectAdmissionApplication"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RejectAdmissionApplicationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rejectAdmissionApplication"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReasonId"}},{"kind":"Field","name":{"kind":"Name","value":"rejectedBy"}}]}}]}}]} as unknown as DocumentNode<RejectAdmissionApplicationMutation, RejectAdmissionApplicationMutationVariables>;
export const DeleteAdmissionApplicationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAdmissionApplication"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAdmissionApplication"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteAdmissionApplicationMutation, DeleteAdmissionApplicationMutationVariables>;
export const RestoreAdmissionApplicationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RestoreAdmissionApplication"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"restoreAdmissionApplication"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<RestoreAdmissionApplicationMutation, RestoreAdmissionApplicationMutationVariables>;
export const UpdateAdmissionBoardSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAdmissionBoardSettings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAdmissionBoardSettingsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAdmissionBoardSettings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tableColumns"}}]}}]}}]} as unknown as DocumentNode<UpdateAdmissionBoardSettingsMutation, UpdateAdmissionBoardSettingsMutationVariables>;
export const CreateAdmissionActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAdmissionActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAdmissionActivityInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAdmissionActivity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateAdmissionActivityMutation, CreateAdmissionActivityMutationVariables>;
export const CreateApplicationContactPersonDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateApplicationContactPerson"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateContactPersonInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createContactPerson"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateApplicationContactPersonMutation, CreateApplicationContactPersonMutationVariables>;
export const CreateAdmissionApplicationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAdmissionApplication"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAdmissionApplicationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAdmissionApplication"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"admissionStageId"}},{"kind":"Field","name":{"kind":"Name","value":"familyId"}}]}}]}}]} as unknown as DocumentNode<CreateAdmissionApplicationMutation, CreateAdmissionApplicationMutationVariables>;
export const DeleteAdmissionActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAdmissionActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAdmissionActivity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteAdmissionActivityMutation, DeleteAdmissionActivityMutationVariables>;
export const FinalizeAdmissionEnrollmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"FinalizeAdmissionEnrollment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FinalizeEnrollmentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"finalizeAdmissionEnrollment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"application"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"enrolledStudentId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"student"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}}]} as unknown as DocumentNode<FinalizeAdmissionEnrollmentMutation, FinalizeAdmissionEnrollmentMutationVariables>;
export const AdmissionActivitiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdmissionActivities"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"admissionActivities"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"applicationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"applicationId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"occurredAt"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdByMembershipId"}},{"kind":"Field","name":{"kind":"Name","value":"createdByMembership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AdmissionActivitiesQuery, AdmissionActivitiesQueryVariables>;
export const AdmissionAppointmentsByApplicationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdmissionAppointmentsByApplication"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"admissionAppointmentsByApplication"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"applicationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"applicationId"}},{"kind":"Field","name":{"kind":"Name","value":"appointmentTypeId"}},{"kind":"Field","name":{"kind":"Name","value":"appointmentType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledAt"}},{"kind":"Field","name":{"kind":"Name","value":"endsAt"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"membershipId"}},{"kind":"Field","name":{"kind":"Name","value":"membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"note"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<AdmissionAppointmentsByApplicationQuery, AdmissionAppointmentsByApplicationQueryVariables>;
export const AdmissionDocumentsByApplicationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdmissionDocumentsByApplication"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"admissionDocumentsByApplication"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"applicationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"originalName"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"uploadedByMembership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AdmissionDocumentsByApplicationQuery, AdmissionDocumentsByApplicationQueryVariables>;
export const AdmissionEmailsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdmissionEmails"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"admissionEmails"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"applicationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"toEmail"}},{"kind":"Field","name":{"kind":"Name","value":"toName"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"bodyHtml"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}},{"kind":"Field","name":{"kind":"Name","value":"sentAt"}},{"kind":"Field","name":{"kind":"Name","value":"template"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sentByMembership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AdmissionEmailsQuery, AdmissionEmailsQueryVariables>;
export const AdmissionRemindersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdmissionReminders"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"admissionReminders"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"applicationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"applicationId"}},{"kind":"Field","name":{"kind":"Name","value":"dueAt"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"note"}},{"kind":"Field","name":{"kind":"Name","value":"assignedToMembershipId"}},{"kind":"Field","name":{"kind":"Name","value":"assignedToMembership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<AdmissionRemindersQuery, AdmissionRemindersQueryVariables>;
export const AdmissionsKanbanRemindersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdmissionsKanbanReminders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"orgAdmissionReminders"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"EnumValue","value":"OPEN"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"applicationId"}},{"kind":"Field","name":{"kind":"Name","value":"dueAt"}}]}}]}}]} as unknown as DocumentNode<AdmissionsKanbanRemindersQuery, AdmissionsKanbanRemindersQueryVariables>;
export const AdmissionsKanbanStagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdmissionsKanbanStages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"admissionStages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"stageType"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}},{"kind":"Field","name":{"kind":"Name","value":"cardFields"}}]}}]}}]} as unknown as DocumentNode<AdmissionsKanbanStagesQuery, AdmissionsKanbanStagesQueryVariables>;
export const AdmissionsBoardSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdmissionsBoardSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"admissionBoardSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tableColumns"}}]}}]}}]} as unknown as DocumentNode<AdmissionsBoardSettingsQuery, AdmissionsBoardSettingsQueryVariables>;
export const AdmissionsKanbanRejectionReasonsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdmissionsKanbanRejectionReasons"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"admissionRejectionReasons"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"position"}}]}}]}}]} as unknown as DocumentNode<AdmissionsKanbanRejectionReasonsQuery, AdmissionsKanbanRejectionReasonsQueryVariables>;
export const AdmissionsKanbanSourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdmissionsKanbanSources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"admissionSources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}},{"kind":"Field","name":{"kind":"Name","value":"position"}}]}}]}}]} as unknown as DocumentNode<AdmissionsKanbanSourcesQuery, AdmissionsKanbanSourcesQueryVariables>;
export const AdmissionsKanbanApplicationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdmissionsKanbanApplications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"admissionApplications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"admissionStageId"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"childFirstName"}},{"kind":"Field","name":{"kind":"Name","value":"childLastName"}},{"kind":"Field","name":{"kind":"Name","value":"childDateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"childGender"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"admissionSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"stageEnteredAt"}},{"kind":"Field","name":{"kind":"Name","value":"familyId"}},{"kind":"Field","name":{"kind":"Name","value":"enrolledStudentId"}},{"kind":"Field","name":{"kind":"Name","value":"assignedGradeLevelId"}},{"kind":"Field","name":{"kind":"Name","value":"assignedGradeLevel"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortCode"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortCode"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"family"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"contactPersons"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"mobile"}},{"kind":"Field","name":{"kind":"Name","value":"roles"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AdmissionsKanbanApplicationsQuery, AdmissionsKanbanApplicationsQueryVariables>;
export const AdmissionApplicationDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdmissionApplicationDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"admissionApplicationById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"admissionStageId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"admissionSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"stageEnteredAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"childFirstName"}},{"kind":"Field","name":{"kind":"Name","value":"childLastName"}},{"kind":"Field","name":{"kind":"Name","value":"childDateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"childGender"}},{"kind":"Field","name":{"kind":"Name","value":"childNotes"}},{"kind":"Field","name":{"kind":"Name","value":"assignedGradeLevelId"}},{"kind":"Field","name":{"kind":"Name","value":"desiredSchoolClassId"}},{"kind":"Field","name":{"kind":"Name","value":"desiredEnrollmentDate"}},{"kind":"Field","name":{"kind":"Name","value":"enrolledStudentId"}},{"kind":"Field","name":{"kind":"Name","value":"familyId"}},{"kind":"Field","name":{"kind":"Name","value":"family"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"contactPersons"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"salutation"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"mobile"}},{"kind":"Field","name":{"kind":"Name","value":"roles"}},{"kind":"Field","name":{"kind":"Name","value":"occupation"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"admissionStage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"stageType"}}]}},{"kind":"Field","name":{"kind":"Name","value":"desiredSchoolClass"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"assignedGradeLevel"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"admissionAuditLogs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"applicationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"fieldName"}},{"kind":"Field","name":{"kind":"Name","value":"oldValue"}},{"kind":"Field","name":{"kind":"Name","value":"newValue"}},{"kind":"Field","name":{"kind":"Name","value":"fromStage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"toStage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"actorMembership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"admissionApplicationsByFamily"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"familyId"},"value":{"kind":"StringValue","value":"00000000-0000-0000-0000-000000000000","block":false}}],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"skip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"BooleanValue","value":true}}]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AdmissionApplicationDetailQuery, AdmissionApplicationDetailQueryVariables>;
export const AdmissionApplicationSiblingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdmissionApplicationSiblings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"familyId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"admissionApplicationsByFamily"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"familyId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"familyId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"childFirstName"}},{"kind":"Field","name":{"kind":"Name","value":"childLastName"}},{"kind":"Field","name":{"kind":"Name","value":"childDateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"admissionStage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]}}]} as unknown as DocumentNode<AdmissionApplicationSiblingsQuery, AdmissionApplicationSiblingsQueryVariables>;
export const OrgAdmissionRemindersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OrgAdmissionReminders"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"AdmissionReminderFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"orgAdmissionReminders"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"applicationId"}},{"kind":"Field","name":{"kind":"Name","value":"dueAt"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"note"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"application"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"childFirstName"}},{"kind":"Field","name":{"kind":"Name","value":"childLastName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"assignedToMembership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}}]}}]} as unknown as DocumentNode<OrgAdmissionRemindersQuery, OrgAdmissionRemindersQueryVariables>;
export const RejectedAdmissionApplicationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RejectedAdmissionApplications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"admissionApplications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"includeFinished"},"value":{"kind":"BooleanValue","value":true}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"childFirstName"}},{"kind":"Field","name":{"kind":"Name","value":"childLastName"}},{"kind":"Field","name":{"kind":"Name","value":"stageEnteredAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReasonId"}},{"kind":"Field","name":{"kind":"Name","value":"rejectedBy"}},{"kind":"Field","name":{"kind":"Name","value":"followUpYear"}},{"kind":"Field","name":{"kind":"Name","value":"family"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"assignedGradeLevel"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"admissionRejectionReasons"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"includeArchived"},"value":{"kind":"BooleanValue","value":true}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]} as unknown as DocumentNode<RejectedAdmissionApplicationsQuery, RejectedAdmissionApplicationsQueryVariables>;
export const AdmissionsEnrollmentClassesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdmissionsEnrollmentClasses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schoolClassesByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"gradeLevels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<AdmissionsEnrollmentClassesQuery, AdmissionsEnrollmentClassesQueryVariables>;
export const MoveAdmissionApplicationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MoveAdmissionApplication"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MoveAdmissionApplicationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"moveAdmissionApplication"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"admissionStageId"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"stageEnteredAt"}}]}}]}}]} as unknown as DocumentNode<MoveAdmissionApplicationMutation, MoveAdmissionApplicationMutationVariables>;
export const CreateAdmissionAppointmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAdmissionAppointment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAdmissionAppointmentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAdmissionAppointment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateAdmissionAppointmentMutation, CreateAdmissionAppointmentMutationVariables>;
export const UpdateAdmissionAppointmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAdmissionAppointment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAdmissionAppointmentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAdmissionAppointment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateAdmissionAppointmentMutation, UpdateAdmissionAppointmentMutationVariables>;
export const DeleteAdmissionAppointmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAdmissionAppointment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAdmissionAppointment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteAdmissionAppointmentMutation, DeleteAdmissionAppointmentMutationVariables>;
export const ResendAdmissionEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResendAdmissionEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resendAdmissionEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}}]}}]}}]} as unknown as DocumentNode<ResendAdmissionEmailMutation, ResendAdmissionEmailMutationVariables>;
export const DeleteAdmissionEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAdmissionEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAdmissionEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteAdmissionEmailMutation, DeleteAdmissionEmailMutationVariables>;
export const CreateAdmissionReminderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAdmissionReminder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAdmissionReminderInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAdmissionReminder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateAdmissionReminderMutation, CreateAdmissionReminderMutationVariables>;
export const UpdateAdmissionReminderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAdmissionReminder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAdmissionReminderInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAdmissionReminder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateAdmissionReminderMutation, UpdateAdmissionReminderMutationVariables>;
export const CompleteAdmissionReminderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CompleteAdmissionReminder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completeAdmissionReminder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CompleteAdmissionReminderMutation, CompleteAdmissionReminderMutationVariables>;
export const UncompleteAdmissionReminderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UncompleteAdmissionReminder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uncompleteAdmissionReminder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UncompleteAdmissionReminderMutation, UncompleteAdmissionReminderMutationVariables>;
export const DeleteAdmissionReminderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAdmissionReminder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAdmissionReminder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteAdmissionReminderMutation, DeleteAdmissionReminderMutationVariables>;
export const PreviewAdmissionEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PreviewAdmissionEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"templateId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"previewAdmissionEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"applicationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"templateId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"templateId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"bodyHtml"}},{"kind":"Field","name":{"kind":"Name","value":"toEmail"}},{"kind":"Field","name":{"kind":"Name","value":"toName"}},{"kind":"Field","name":{"kind":"Name","value":"availableVariables"}}]}}]}}]} as unknown as DocumentNode<PreviewAdmissionEmailQuery, PreviewAdmissionEmailQueryVariables>;
export const ReorderAdmissionApplicationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReorderAdmissionApplications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ReorderAdmissionApplicationsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reorderAdmissionApplications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"position"}}]}}]}}]} as unknown as DocumentNode<ReorderAdmissionApplicationsMutation, ReorderAdmissionApplicationsMutationVariables>;
export const SendAdmissionEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendAdmissionEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SendAdmissionEmailInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendAdmissionEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}}]}}]}}]} as unknown as DocumentNode<SendAdmissionEmailMutation, SendAdmissionEmailMutationVariables>;
export const CreateAdmissionStageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAdmissionStage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAdmissionStageInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAdmissionStage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"stageType"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"cardFields"}}]}}]}}]} as unknown as DocumentNode<CreateAdmissionStageMutation, CreateAdmissionStageMutationVariables>;
export const UpdateAdmissionStageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAdmissionStage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAdmissionStageInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAdmissionStage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"stageType"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"cardFields"}}]}}]}}]} as unknown as DocumentNode<UpdateAdmissionStageMutation, UpdateAdmissionStageMutationVariables>;
export const ArchiveAdmissionStageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchiveAdmissionStage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archiveAdmissionStage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<ArchiveAdmissionStageMutation, ArchiveAdmissionStageMutationVariables>;
export const ReorderAdmissionStagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReorderAdmissionStages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ReorderAdmissionStagesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reorderAdmissionStages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"position"}}]}}]}}]} as unknown as DocumentNode<ReorderAdmissionStagesMutation, ReorderAdmissionStagesMutationVariables>;
export const UpdateAdmissionActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAdmissionActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAdmissionActivityInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAdmissionActivity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateAdmissionActivityMutation, UpdateAdmissionActivityMutationVariables>;
export const UpdateContactPersonDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateContactPerson"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateContactPersonInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateContactPerson"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateContactPersonMutation, UpdateContactPersonMutationVariables>;
export const UpdateAdmissionApplicationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAdmissionApplication"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAdmissionApplicationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAdmissionApplication"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateAdmissionApplicationMutation, UpdateAdmissionApplicationMutationVariables>;
export const AuthUserIdByUserIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AuthUserIdByUserId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authUserIdByUserId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}]}]}}]} as unknown as DocumentNode<AuthUserIdByUserIdQuery, AuthUserIdByUserIdQueryVariables>;
export const ArchiveConsentPurposeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchiveConsentPurpose"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archiveConsentPurpose"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<ArchiveConsentPurposeMutation, ArchiveConsentPurposeMutationVariables>;
export const ConsentPurposesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ConsentPurposes"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"includeArchived"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"consentPurposes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"includeArchived"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeArchived"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"appliesTo"}},{"kind":"Field","name":{"kind":"Name","value":"legalBasis"}},{"kind":"Field","name":{"kind":"Name","value":"requiresEvidence"}},{"kind":"Field","name":{"kind":"Name","value":"isMandatory"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}}]}}]}}]} as unknown as DocumentNode<ConsentPurposesQuery, ConsentPurposesQueryVariables>;
export const ConsentsForSubjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ConsentsForSubject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"subjectType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ConsentSubjectType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"subjectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"consentsForSubject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"subjectType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"subjectType"}}},{"kind":"Argument","name":{"kind":"Name","value":"subjectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"subjectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"subjectType"}},{"kind":"Field","name":{"kind":"Name","value":"subjectId"}},{"kind":"Field","name":{"kind":"Name","value":"purposeId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"grantedByContactPersonId"}},{"kind":"Field","name":{"kind":"Name","value":"decidedAt"}},{"kind":"Field","name":{"kind":"Name","value":"withdrawnAt"}},{"kind":"Field","name":{"kind":"Name","value":"evidenceUrl"}},{"kind":"Field","name":{"kind":"Name","value":"note"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}}]}}]} as unknown as DocumentNode<ConsentsForSubjectQuery, ConsentsForSubjectQueryVariables>;
export const RecordConsentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RecordConsent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RecordConsentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recordConsent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<RecordConsentMutation, RecordConsentMutationVariables>;
export const CreateConsentPurposeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateConsentPurpose"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateConsentPurposeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createConsentPurpose"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateConsentPurposeMutation, CreateConsentPurposeMutationVariables>;
export const UpdateConsentPurposeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateConsentPurpose"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateConsentPurposeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateConsentPurpose"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateConsentPurposeMutation, UpdateConsentPurposeMutationVariables>;
export const WithdrawConsentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WithdrawConsent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WithdrawConsentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"withdrawConsent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<WithdrawConsentMutation, WithdrawConsentMutationVariables>;
export const ArchiveContactPersonDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchiveContactPerson"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archiveContactPerson"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<ArchiveContactPersonMutation, ArchiveContactPersonMutationVariables>;
export const CreateAddressDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAddress"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAddressInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAddress"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateAddressMutation, CreateAddressMutationVariables>;
export const CreateContactPersonDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateContactPerson"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateContactPersonInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createContactPerson"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateContactPersonMutation, CreateContactPersonMutationVariables>;
export const GetContactPersonsSharingAddressDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetContactPersonsSharingAddress"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"addressId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"excludeContactPersonId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contactPersonsSharingAddress"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"addressId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"addressId"}}},{"kind":"Argument","name":{"kind":"Name","value":"excludeContactPersonId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"excludeContactPersonId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"roles"}}]}}]}}]} as unknown as DocumentNode<GetContactPersonsSharingAddressQuery, GetContactPersonsSharingAddressQueryVariables>;
export const GetContactPersonByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetContactPersonById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contactPersonById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"salutation"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"middleName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"mobile"}},{"kind":"Field","name":{"kind":"Name","value":"dateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"socialSecurityNumber"}},{"kind":"Field","name":{"kind":"Name","value":"nationalities"}},{"kind":"Field","name":{"kind":"Name","value":"preferredLanguages"}},{"kind":"Field","name":{"kind":"Name","value":"roles"}},{"kind":"Field","name":{"kind":"Name","value":"occupation"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"addressId"}},{"kind":"Field","name":{"kind":"Name","value":"address"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"street"}},{"kind":"Field","name":{"kind":"Name","value":"houseNumber"}},{"kind":"Field","name":{"kind":"Name","value":"addressLine2"}},{"kind":"Field","name":{"kind":"Name","value":"postalCode"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"country"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isoCode"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetContactPersonByIdQuery, GetContactPersonByIdQueryVariables>;
export const GetContactPersonsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetContactPersons"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contactPersonsByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"mobile"}},{"kind":"Field","name":{"kind":"Name","value":"occupation"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}}]}}]}}]} as unknown as DocumentNode<GetContactPersonsQuery, GetContactPersonsQueryVariables>;
export const GetRelatedAddressesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRelatedAddresses"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contactPersonId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"relatedAddressesForContactPerson"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contactPersonId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contactPersonId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"address"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"street"}},{"kind":"Field","name":{"kind":"Name","value":"houseNumber"}},{"kind":"Field","name":{"kind":"Name","value":"addressLine2"}},{"kind":"Field","name":{"kind":"Name","value":"postalCode"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"country"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isoCode"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"contactPersonName"}},{"kind":"Field","name":{"kind":"Name","value":"relationshipType"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}}]}}]}}]} as unknown as DocumentNode<GetRelatedAddressesQuery, GetRelatedAddressesQueryVariables>;
export const GetContactPersonsByStudentIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetContactPersonsByStudentId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contactPersonsByStudentId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"relationshipType"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimaryContact"}},{"kind":"Field","name":{"kind":"Name","value":"hasCustody"}},{"kind":"Field","name":{"kind":"Name","value":"isPickupAuthorized"}},{"kind":"Field","name":{"kind":"Name","value":"emergencyPriority"}},{"kind":"Field","name":{"kind":"Name","value":"livesWithStudent"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"contactPerson"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"mobile"}}]}}]}}]}}]} as unknown as DocumentNode<GetContactPersonsByStudentIdQuery, GetContactPersonsByStudentIdQueryVariables>;
export const LinkContactPersonToStudentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LinkContactPersonToStudent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LinkContactPersonInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"linkContactPersonToStudent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<LinkContactPersonToStudentMutation, LinkContactPersonToStudentMutationVariables>;
export const UnlinkContactPersonFromStudentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnlinkContactPersonFromStudent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unlinkContactPersonFromStudent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<UnlinkContactPersonFromStudentMutation, UnlinkContactPersonFromStudentMutationVariables>;
export const UpdateAddressDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAddress"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAddressInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAddress"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateAddressMutation, UpdateAddressMutationVariables>;
export const UpdateStudentContactPersonLinkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateStudentContactPersonLink"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateStudentContactPersonInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateStudentContactPersonLink"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateStudentContactPersonLinkMutation, UpdateStudentContactPersonLinkMutationVariables>;
export const DeleteCountryInputTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteCountryInputTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteCountryInputTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteCountryInputTemplateMutation, DeleteCountryInputTemplateMutationVariables>;
export const CountryInputTemplatesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CountryInputTemplates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"countryInputTemplates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"fieldType"}},{"kind":"Field","name":{"kind":"Name","value":"mask"}},{"kind":"Field","name":{"kind":"Name","value":"placeholder"}},{"kind":"Field","name":{"kind":"Name","value":"maxLength"}},{"kind":"Field","name":{"kind":"Name","value":"regex"}},{"kind":"Field","name":{"kind":"Name","value":"prefix"}},{"kind":"Field","name":{"kind":"Name","value":"validatorKind"}}]}}]}}]} as unknown as DocumentNode<CountryInputTemplatesQuery, CountryInputTemplatesQueryVariables>;
export const UpsertCountryInputTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertCountryInputTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpsertCountryInputTemplateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertCountryInputTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"fieldType"}},{"kind":"Field","name":{"kind":"Name","value":"mask"}},{"kind":"Field","name":{"kind":"Name","value":"placeholder"}},{"kind":"Field","name":{"kind":"Name","value":"maxLength"}},{"kind":"Field","name":{"kind":"Name","value":"regex"}},{"kind":"Field","name":{"kind":"Name","value":"prefix"}},{"kind":"Field","name":{"kind":"Name","value":"validatorKind"}}]}}]}}]} as unknown as DocumentNode<UpsertCountryInputTemplateMutation, UpsertCountryInputTemplateMutationVariables>;
export const ArchiveCurriculumNodeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchiveCurriculumNode"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archiveCurriculumNode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<ArchiveCurriculumNodeMutation, ArchiveCurriculumNodeMutationVariables>;
export const ArchiveCurriculumDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchiveCurriculum"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archiveCurriculum"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<ArchiveCurriculumMutation, ArchiveCurriculumMutationVariables>;
export const CreateCurriculumDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCurriculum"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCurriculumInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCurriculum"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]} as unknown as DocumentNode<CreateCurriculumMutation, CreateCurriculumMutationVariables>;
export const GetCurriculaDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCurricula"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"includeArchived"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"curricula"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"includeArchived"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeArchived"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]} as unknown as DocumentNode<GetCurriculaQuery, GetCurriculaQueryVariables>;
export const GetCurriculumByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCurriculumById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"curriculumById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]} as unknown as DocumentNode<GetCurriculumByIdQuery, GetCurriculumByIdQueryVariables>;
export const GetCurriculumLevelsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCurriculumLevels"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"curriculumId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"includeArchived"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"curriculumLevels"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"curriculumId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"curriculumId"}}},{"kind":"Argument","name":{"kind":"Name","value":"includeArchived"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeArchived"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetCurriculumLevelsQuery, GetCurriculumLevelsQueryVariables>;
export const GetCurriculumNodesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCurriculumNodes"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"curriculumId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"levelId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"includeArchived"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"curriculumNodes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"curriculumId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"curriculumId"}}},{"kind":"Argument","name":{"kind":"Name","value":"levelId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"levelId"}}},{"kind":"Argument","name":{"kind":"Name","value":"includeArchived"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeArchived"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"curriculumId"}},{"kind":"Field","name":{"kind":"Name","value":"levelId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"nodeType"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}},{"kind":"Field","name":{"kind":"Name","value":"lessonType"}},{"kind":"Field","name":{"kind":"Name","value":"lessonScale"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}}]}}]}}]}}]} as unknown as DocumentNode<GetCurriculumNodesQuery, GetCurriculumNodesQueryVariables>;
export const HardDeleteCurriculumDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"HardDeleteCurriculum"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hardDeleteCurriculum"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<HardDeleteCurriculumMutation, HardDeleteCurriculumMutationVariables>;
export const ImportCurriculumFromPlanDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ImportCurriculumFromPlan"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ImportCurriculumPlanInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"importCurriculumFromPlan"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]} as unknown as DocumentNode<ImportCurriculumFromPlanMutation, ImportCurriculumFromPlanMutationVariables>;
export const ReorderCurriculumNodesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReorderCurriculumNodes"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ReorderCurriculumNodesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reorderCurriculumNodes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"position"}}]}}]}}]} as unknown as DocumentNode<ReorderCurriculumNodesMutation, ReorderCurriculumNodesMutationVariables>;
export const UnarchiveCurriculumNodeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnarchiveCurriculumNode"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unarchiveCurriculumNode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<UnarchiveCurriculumNodeMutation, UnarchiveCurriculumNodeMutationVariables>;
export const UnarchiveCurriculumDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnarchiveCurriculum"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unarchiveCurriculum"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}}]}}]}}]} as unknown as DocumentNode<UnarchiveCurriculumMutation, UnarchiveCurriculumMutationVariables>;
export const UpdateCurriculumDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCurriculum"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateCurriculumInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCurriculum"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateCurriculumMutation, UpdateCurriculumMutationVariables>;
export const UpdateLessonClassificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateLessonClassification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateCurriculumNodeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCurriculumNode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"lessonType"}},{"kind":"Field","name":{"kind":"Name","value":"lessonScale"}}]}}]}}]} as unknown as DocumentNode<UpdateLessonClassificationMutation, UpdateLessonClassificationMutationVariables>;
export const UpsertCurriculumLevelTranslationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertCurriculumLevelTranslation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpsertCurriculumLevelTranslationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertCurriculumLevelTranslation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<UpsertCurriculumLevelTranslationMutation, UpsertCurriculumLevelTranslationMutationVariables>;
export const UpsertCurriculumNodeTranslationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertCurriculumNodeTranslation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpsertCurriculumNodeTranslationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertCurriculumNodeTranslation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}}]}}]}}]} as unknown as DocumentNode<UpsertCurriculumNodeTranslationMutation, UpsertCurriculumNodeTranslationMutationVariables>;
export const CreateDataBreachDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateDataBreach"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateDataBreachInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createDataBreach"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateDataBreachMutation, CreateDataBreachMutationVariables>;
export const DataBreachesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DataBreaches"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DataBreachStatus"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataBreaches"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"detectedAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"riskLevel"}},{"kind":"Field","name":{"kind":"Name","value":"affectedScope"}},{"kind":"Field","name":{"kind":"Name","value":"affectedCount"}},{"kind":"Field","name":{"kind":"Name","value":"authorityNotifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"subjectsNotifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"measures"}},{"kind":"Field","name":{"kind":"Name","value":"closedAt"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"authorityNotificationDueAt"}},{"kind":"Field","name":{"kind":"Name","value":"assigneeMembership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}}]}}]} as unknown as DocumentNode<DataBreachesQuery, DataBreachesQueryVariables>;
export const UpdateDataBreachDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateDataBreach"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateDataBreachInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateDataBreach"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<UpdateDataBreachMutation, UpdateDataBreachMutationVariables>;
export const CreateDataSubjectRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateDataSubjectRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateDataSubjectRequestInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createDataSubjectRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateDataSubjectRequestMutation, CreateDataSubjectRequestMutationVariables>;
export const DataSubjectRequestsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DataSubjectRequests"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DataSubjectRequestStatus"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataSubjectRequests"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subjectType"}},{"kind":"Field","name":{"kind":"Name","value":"subjectId"}},{"kind":"Field","name":{"kind":"Name","value":"subjectName"}},{"kind":"Field","name":{"kind":"Name","value":"contactEmail"}},{"kind":"Field","name":{"kind":"Name","value":"receivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedAt"}},{"kind":"Field","name":{"kind":"Name","value":"resolutionNote"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"assigneeMembershipId"}},{"kind":"Field","name":{"kind":"Name","value":"assigneeMembership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}}]}}]} as unknown as DocumentNode<DataSubjectRequestsQuery, DataSubjectRequestsQueryVariables>;
export const DataSubjectExportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DataSubjectExport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"subjectType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataSubjectType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"subjectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataSubjectExport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"subjectType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"subjectType"}}},{"kind":"Argument","name":{"kind":"Name","value":"subjectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"subjectId"}}}]}]}}]} as unknown as DocumentNode<DataSubjectExportQuery, DataSubjectExportQueryVariables>;
export const UpdateDataSubjectRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateDataSubjectRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateDataSubjectRequestInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateDataSubjectRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<UpdateDataSubjectRequestMutation, UpdateDataSubjectRequestMutationVariables>;
export const EmailTemplatesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EmailTemplates"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"category"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"EmailTemplateCategory"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"emailTemplates"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"category"},"value":{"kind":"Variable","name":{"kind":"Name","value":"category"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"bodyHtml"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isAutomatic"}},{"kind":"Field","name":{"kind":"Name","value":"sentCount"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<EmailTemplatesQuery, EmailTemplatesQueryVariables>;
export const CreateEmailTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateEmailTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEmailTemplateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEmailTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateEmailTemplateMutation, CreateEmailTemplateMutationVariables>;
export const UpdateEmailTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateEmailTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateEmailTemplateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateEmailTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateEmailTemplateMutation, UpdateEmailTemplateMutationVariables>;
export const DeleteEmailTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteEmailTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteEmailTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteEmailTemplateMutation, DeleteEmailTemplateMutationVariables>;
export const ArchiveEmployeeAbsenceCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchiveEmployeeAbsenceCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archiveEmployeeAbsenceCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<ArchiveEmployeeAbsenceCategoryMutation, ArchiveEmployeeAbsenceCategoryMutationVariables>;
export const CreateEmployeeAbsenceCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateEmployeeAbsenceCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEmployeeAbsenceCategoryInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEmployeeAbsenceCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateEmployeeAbsenceCategoryMutation, CreateEmployeeAbsenceCategoryMutationVariables>;
export const EmployeeAbsenceCategoriesByOrgIdFullDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EmployeeAbsenceCategoriesByOrgIdFull"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeeAbsenceCategoriesByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"systemCode"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"countsAsWorkTime"}},{"kind":"Field","name":{"kind":"Name","value":"isPaid"}},{"kind":"Field","name":{"kind":"Name","value":"affectsVacationBalance"}},{"kind":"Field","name":{"kind":"Name","value":"defaultIsVacationCapable"}},{"kind":"Field","name":{"kind":"Name","value":"reducesVacationEntitlementAfterDays"}},{"kind":"Field","name":{"kind":"Name","value":"requiresCertificate"}},{"kind":"Field","name":{"kind":"Name","value":"certificateRequiredFromDay"}},{"kind":"Field","name":{"kind":"Name","value":"maxDaysPerYear"}},{"kind":"Field","name":{"kind":"Name","value":"defaultPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"requiresApproval"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"iconName"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]} as unknown as DocumentNode<EmployeeAbsenceCategoriesByOrgIdFullQuery, EmployeeAbsenceCategoriesByOrgIdFullQueryVariables>;
export const EmployeeAbsenceCategoryByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EmployeeAbsenceCategoryById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeeAbsenceCategoryById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"systemCode"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"countsAsWorkTime"}},{"kind":"Field","name":{"kind":"Name","value":"isPaid"}},{"kind":"Field","name":{"kind":"Name","value":"affectsVacationBalance"}},{"kind":"Field","name":{"kind":"Name","value":"defaultIsVacationCapable"}},{"kind":"Field","name":{"kind":"Name","value":"reducesVacationEntitlementAfterDays"}},{"kind":"Field","name":{"kind":"Name","value":"requiresCertificate"}},{"kind":"Field","name":{"kind":"Name","value":"certificateRequiredFromDay"}},{"kind":"Field","name":{"kind":"Name","value":"maxDaysPerYear"}},{"kind":"Field","name":{"kind":"Name","value":"defaultPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"requiresApproval"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"iconName"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]} as unknown as DocumentNode<EmployeeAbsenceCategoryByIdQuery, EmployeeAbsenceCategoryByIdQueryVariables>;
export const ReorderEmployeeAbsenceCategoriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReorderEmployeeAbsenceCategories"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reorderEmployeeAbsenceCategories"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]}}]} as unknown as DocumentNode<ReorderEmployeeAbsenceCategoriesMutation, ReorderEmployeeAbsenceCategoriesMutationVariables>;
export const SetEmployeeAbsenceCategoryActiveDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetEmployeeAbsenceCategoryActive"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isActive"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setEmployeeAbsenceCategoryActive"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"isActive"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isActive"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]} as unknown as DocumentNode<SetEmployeeAbsenceCategoryActiveMutation, SetEmployeeAbsenceCategoryActiveMutationVariables>;
export const UpdateEmployeeAbsenceCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateEmployeeAbsenceCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateEmployeeAbsenceCategoryInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateEmployeeAbsenceCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateEmployeeAbsenceCategoryMutation, UpdateEmployeeAbsenceCategoryMutationVariables>;
export const CreateEmployeeAbsenceNoticeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateEmployeeAbsenceNotice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createEmployeeAbsenceInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEmployeeAbsenceNoticeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEmployeeAbsenceNotice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createEmployeeAbsenceInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createEmployeeAbsenceInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateEmployeeAbsenceNoticeMutation, CreateEmployeeAbsenceNoticeMutationVariables>;
export const GetEmployeeAbsenceCategoriesByOrgIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmployeeAbsenceCategoriesByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeeAbsenceCategoriesByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"systemCode"}}]}}]}}]} as unknown as DocumentNode<GetEmployeeAbsenceCategoriesByOrgIdQuery, GetEmployeeAbsenceCategoriesByOrgIdQueryVariables>;
export const CreateEmployeeNoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateEmployeeNote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createEmployeeNoteInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEmployeeNoteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEmployeeNote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createEmployeeNoteInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createEmployeeNoteInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateEmployeeNoteMutation, CreateEmployeeNoteMutationVariables>;
export const GetEmployeeNotesByEmployeeIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmployeeNotesByEmployeeId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeeNotesByEmployeeId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"employeeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"isConfidential"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"authorMembership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetEmployeeNotesByEmployeeIdQuery, GetEmployeeNotesByEmployeeIdQueryVariables>;
export const CreateEmployeeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateEmployee"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createEmployeeInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEmployeeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEmployee"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createEmployeeInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createEmployeeInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateEmployeeMutation, CreateEmployeeMutationVariables>;
export const EmployeeContractsByEmployeeIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EmployeeContractsByEmployeeId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeeContractsByEmployeeId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"employeeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"employeeId"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"probationEndDate"}},{"kind":"Field","name":{"kind":"Name","value":"contractType"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"supervisorMembershipId"}},{"kind":"Field","name":{"kind":"Name","value":"workloadPercent"}},{"kind":"Field","name":{"kind":"Name","value":"weeklyHours"}},{"kind":"Field","name":{"kind":"Name","value":"grossSalary"}},{"kind":"Field","name":{"kind":"Name","value":"paymentInterval"}},{"kind":"Field","name":{"kind":"Name","value":"has13thSalary"}},{"kind":"Field","name":{"kind":"Name","value":"annualVacationDays"}},{"kind":"Field","name":{"kind":"Name","value":"remainingVacationDays"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"documentUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]} as unknown as DocumentNode<EmployeeContractsByEmployeeIdQuery, EmployeeContractsByEmployeeIdQueryVariables>;
export const CreateEmployeeContractDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateEmployeeContract"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEmployeeContractInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEmployeeContract"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateEmployeeContractMutation, CreateEmployeeContractMutationVariables>;
export const UpdateEmployeeContractDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateEmployeeContract"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateEmployeeContractInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateEmployeeContract"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateEmployeeContractMutation, UpdateEmployeeContractMutationVariables>;
export const DeleteEmployeeContractDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteEmployeeContract"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteEmployeeContract"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteEmployeeContractMutation, DeleteEmployeeContractMutationVariables>;
export const UpsertEmployeeOnboardingDraftDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertEmployeeOnboardingDraft"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"EmployeeOnboardingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertEmployeeOnboardingDraft"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"invitationStatus"}}]}}]}}]} as unknown as DocumentNode<UpsertEmployeeOnboardingDraftMutation, UpsertEmployeeOnboardingDraftMutationVariables>;
export const FinalizeEmployeeOnboardingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"FinalizeEmployeeOnboarding"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FinalizeEmployeeOnboardingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"finalizeEmployeeOnboarding"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"invitationStatus"}}]}}]}}]} as unknown as DocumentNode<FinalizeEmployeeOnboardingMutation, FinalizeEmployeeOnboardingMutationVariables>;
export const SendEmployeeInvitationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendEmployeeInvitation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendEmployeeInvitation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"employeeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"invitationStatus"}}]}}]}}]} as unknown as DocumentNode<SendEmployeeInvitationMutation, SendEmployeeInvitationMutationVariables>;
export const GetEmployeeAuditLogDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmployeeAuditLog"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeeAuditLog"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"employeeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"entityType"}},{"kind":"Field","name":{"kind":"Name","value":"fieldName"}},{"kind":"Field","name":{"kind":"Name","value":"oldValue"}},{"kind":"Field","name":{"kind":"Name","value":"newValue"}},{"kind":"Field","name":{"kind":"Name","value":"actorMembershipId"}},{"kind":"Field","name":{"kind":"Name","value":"actorMembership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetEmployeeAuditLogQuery, GetEmployeeAuditLogQueryVariables>;
export const GetEmployeeByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmployeeById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeeById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"employeeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"timeTrackingEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"persona"}},{"kind":"Field","name":{"kind":"Name","value":"contactPhone"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"dateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"socialSecurityNumber"}},{"kind":"Field","name":{"kind":"Name","value":"street"}},{"kind":"Field","name":{"kind":"Name","value":"houseNumber"}},{"kind":"Field","name":{"kind":"Name","value":"addressLine2"}},{"kind":"Field","name":{"kind":"Name","value":"postalCode"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"userEmails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemCode"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetEmployeeByIdQuery, GetEmployeeByIdQueryVariables>;
export const GetEmployeeEmergencyProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmployeeEmergencyProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeeEmergencyProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"employeeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"employeeId"}},{"kind":"Field","name":{"kind":"Name","value":"contact1Name"}},{"kind":"Field","name":{"kind":"Name","value":"contact1Relationship"}},{"kind":"Field","name":{"kind":"Name","value":"contact1Phone"}},{"kind":"Field","name":{"kind":"Name","value":"contact1Email"}},{"kind":"Field","name":{"kind":"Name","value":"contact2Name"}},{"kind":"Field","name":{"kind":"Name","value":"contact2Relationship"}},{"kind":"Field","name":{"kind":"Name","value":"contact2Phone"}},{"kind":"Field","name":{"kind":"Name","value":"contact2Email"}},{"kind":"Field","name":{"kind":"Name","value":"bloodType"}},{"kind":"Field","name":{"kind":"Name","value":"allergies"}},{"kind":"Field","name":{"kind":"Name","value":"chronicConditions"}},{"kind":"Field","name":{"kind":"Name","value":"emergencyMedications"}},{"kind":"Field","name":{"kind":"Name","value":"primaryDoctorName"}},{"kind":"Field","name":{"kind":"Name","value":"primaryDoctorPhone"}},{"kind":"Field","name":{"kind":"Name","value":"pharmacyName"}}]}}]}}]} as unknown as DocumentNode<GetEmployeeEmergencyProfileQuery, GetEmployeeEmergencyProfileQueryVariables>;
export const GetEmployeeHrProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmployeeHrProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeeHrProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"employeeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"employeeId"}},{"kind":"Field","name":{"kind":"Name","value":"iban"}},{"kind":"Field","name":{"kind":"Name","value":"bankAccountHolder"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"bvgInsuranceNumber"}},{"kind":"Field","name":{"kind":"Name","value":"withholdingTaxCode"}},{"kind":"Field","name":{"kind":"Name","value":"nationality"}},{"kind":"Field","name":{"kind":"Name","value":"residencePermitType"}},{"kind":"Field","name":{"kind":"Name","value":"residencePermitValidUntil"}},{"kind":"Field","name":{"kind":"Name","value":"maritalStatus"}},{"kind":"Field","name":{"kind":"Name","value":"denomination"}},{"kind":"Field","name":{"kind":"Name","value":"numberOfChildren"}},{"kind":"Field","name":{"kind":"Name","value":"onboardingStatus"}},{"kind":"Field","name":{"kind":"Name","value":"ndaSigned"}},{"kind":"Field","name":{"kind":"Name","value":"criminalRecordSubmitted"}}]}}]}}]} as unknown as DocumentNode<GetEmployeeHrProfileQuery, GetEmployeeHrProfileQueryVariables>;
export const GetEmployeesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmployees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeesByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workloadPercent"}},{"kind":"Field","name":{"kind":"Name","value":"timeBalanceMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employee"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"timeTrackingEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"invitationStatus"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"userEmails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"persona"}},{"kind":"Field","name":{"kind":"Name","value":"contactPhone"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teamMembers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetEmployeesQuery, GetEmployeesQueryVariables>;
export const UpdateEmployeeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateEmployee"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateEmployeeInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateEmployeeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateEmployee"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateEmployeeInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateEmployeeInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateEmployeeMutation, UpdateEmployeeMutationVariables>;
export const UpsertEmployeeEmergencyProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertEmployeeEmergencyProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpsertEmployeeEmergencyProfileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertEmployeeEmergencyProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpsertEmployeeEmergencyProfileMutation, UpsertEmployeeEmergencyProfileMutationVariables>;
export const UpsertEmployeeHrProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertEmployeeHrProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpsertEmployeeHrProfileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertEmployeeHrProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpsertEmployeeHrProfileMutation, UpsertEmployeeHrProfileMutationVariables>;
export const FamiliesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Families"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"families"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"contactPersons"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}}]} as unknown as DocumentNode<FamiliesQuery, FamiliesQueryVariables>;
export const CreateGradeLevelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateGradeLevel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGradeLevelInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createGradeLevel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"shortCode"}},{"kind":"Field","name":{"kind":"Name","value":"ageMin"}},{"kind":"Field","name":{"kind":"Name","value":"ageMax"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]}}]} as unknown as DocumentNode<CreateGradeLevelMutation, CreateGradeLevelMutationVariables>;
export const DeleteGradeLevelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteGradeLevel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteGradeLevel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteGradeLevelMutation, DeleteGradeLevelMutationVariables>;
export const GetGradeLevelsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetGradeLevels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gradeLevelsByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"shortCode"}},{"kind":"Field","name":{"kind":"Name","value":"ageMin"}},{"kind":"Field","name":{"kind":"Name","value":"ageMax"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"classCount"}},{"kind":"Field","name":{"kind":"Name","value":"studentCount"}}]}}]}}]} as unknown as DocumentNode<GetGradeLevelsQuery, GetGradeLevelsQueryVariables>;
export const ReorderGradeLevelsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReorderGradeLevels"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ReorderGradeLevelsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reorderGradeLevels"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]}}]} as unknown as DocumentNode<ReorderGradeLevelsMutation, ReorderGradeLevelsMutationVariables>;
export const UpdateGradeLevelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateGradeLevel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateGradeLevelInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateGradeLevel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"shortCode"}},{"kind":"Field","name":{"kind":"Name","value":"ageMin"}},{"kind":"Field","name":{"kind":"Name","value":"ageMax"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]}}]} as unknown as DocumentNode<UpdateGradeLevelMutation, UpdateGradeLevelMutationVariables>;
export const CreateOrganizationSettingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateOrganizationSetting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateOrganizationSettingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createOrganizationSetting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"hasValue"}}]}}]}}]} as unknown as DocumentNode<CreateOrganizationSettingMutation, CreateOrganizationSettingMutationVariables>;
export const DeleteOrganizationSettingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteOrganizationSetting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteOrganizationSetting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}}]}]}}]} as unknown as DocumentNode<DeleteOrganizationSettingMutation, DeleteOrganizationSettingMutationVariables>;
export const GetOrganizationSettingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrganizationSetting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"decrypt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizationSetting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}},{"kind":"Argument","name":{"kind":"Name","value":"decrypt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"decrypt"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"hasValue"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetOrganizationSettingQuery, GetOrganizationSettingQueryVariables>;
export const GetOrganizationSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrganizationSettings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizationSettings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"hasValue"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetOrganizationSettingsQuery, GetOrganizationSettingsQueryVariables>;
export const UpdateOrganizationSettingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateOrganizationSetting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateOrganizationSettingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateOrganizationSetting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"hasValue"}}]}}]}}]} as unknown as DocumentNode<UpdateOrganizationSettingMutation, UpdateOrganizationSettingMutationVariables>;
export const IsOrganizationDomainAvailableDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"IsOrganizationDomainAvailable"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"domain"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isOrganizationDomainAvailable"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"domain"},"value":{"kind":"Variable","name":{"kind":"Name","value":"domain"}}}]}]}}]} as unknown as DocumentNode<IsOrganizationDomainAvailableQuery, IsOrganizationDomainAvailableQueryVariables>;
export const IsOrganizationSubdomainAvailableDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"IsOrganizationSubdomainAvailable"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"subdomain"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isOrganizationSubdomainAvailable"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"subdomain"},"value":{"kind":"Variable","name":{"kind":"Name","value":"subdomain"}}}]}]}}]} as unknown as DocumentNode<IsOrganizationSubdomainAvailableQuery, IsOrganizationSubdomainAvailableQueryVariables>;
export const CreateOrganizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateOrganization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createOrganization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateOrganizationMutation, CreateOrganizationMutationVariables>;
export const OrganizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Organization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"subdomain"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"street"}},{"kind":"Field","name":{"kind":"Name","value":"zip"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"website"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"bvgProvider"}},{"kind":"Field","name":{"kind":"Name","value":"bvgContactPhone"}},{"kind":"Field","name":{"kind":"Name","value":"uvgProvider"}},{"kind":"Field","name":{"kind":"Name","value":"uvgContactPhone"}},{"kind":"Field","name":{"kind":"Name","value":"dailySicknessProvider"}},{"kind":"Field","name":{"kind":"Name","value":"dailySicknessContactPhone"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<OrganizationQuery, OrganizationQueryVariables>;
export const GetOrganizationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrganizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"subdomain"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]} as unknown as DocumentNode<GetOrganizationsQuery, GetOrganizationsQueryVariables>;
export const RemoveOrganizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveOrganization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeOrganization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<RemoveOrganizationMutation, RemoveOrganizationMutationVariables>;
export const UpdateOrganizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateOrganization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateOrganizationInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateOrganizationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateOrganization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateOrganizationInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateOrganizationInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"subdomain"}}]}}]}}]} as unknown as DocumentNode<UpdateOrganizationMutation, UpdateOrganizationMutationVariables>;
export const AddTaskNoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddTaskNote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddTaskNoteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addTaskNote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"notes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"authorName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<AddTaskNoteMutation, AddTaskNoteMutationVariables>;
export const ArchiveProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchiveProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"archived"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archiveProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"archived"},"value":{"kind":"Variable","name":{"kind":"Name","value":"archived"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}}]}}]}}]} as unknown as DocumentNode<ArchiveProjectMutation, ArchiveProjectMutationVariables>;
export const CreateProjectFromTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProjectFromTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateProjectFromTemplateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createProjectFromTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateProjectFromTemplateMutation, CreateProjectFromTemplateMutationVariables>;
export const CreateProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateProjectInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateProjectMutation, CreateProjectMutationVariables>;
export const CreateTasksFromProtocolDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTasksFromProtocol"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTasksFromProtocolInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTasksFromProtocol"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateTasksFromProtocolMutation, CreateTasksFromProtocolMutationVariables>;
export const DeleteProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteProjectMutation, DeleteProjectMutationVariables>;
export const MyTasksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyTasks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myTasks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"dueTime"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"checklist"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"done"}}]}},{"kind":"Field","name":{"kind":"Name","value":"notes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"authorName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdByMembershipId"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"protocol"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"admissionApplicationId"}},{"kind":"Field","name":{"kind":"Name","value":"admissionApplication"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"childFirstName"}},{"kind":"Field","name":{"kind":"Name","value":"childLastName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"membershipId"}},{"kind":"Field","name":{"kind":"Name","value":"membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"userEmail"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<MyTasksQuery, MyTasksQueryVariables>;
export const MembershipsByOrgIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MembershipsByOrgId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"membershipsByOrgId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"isSuperAdmin"}}]}},{"kind":"Field","name":{"kind":"Name","value":"userEmail"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<MembershipsByOrgIdQuery, MembershipsByOrgIdQueryVariables>;
export const TasksByProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TasksByProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tasksByProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"dueTime"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"checklist"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"done"}}]}},{"kind":"Field","name":{"kind":"Name","value":"notes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"authorName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdByMembershipId"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"protocol"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"membershipId"}},{"kind":"Field","name":{"kind":"Name","value":"membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"userEmail"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<TasksByProjectQuery, TasksByProjectQueryVariables>;
export const ProjectByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"taskStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"done"}}]}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"userEmail"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<ProjectByIdQuery, ProjectByIdQueryVariables>;
export const MyProjectsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyProjects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myProjects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"taskStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"done"}}]}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"userEmail"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<MyProjectsQuery, MyProjectsQueryVariables>;
export const TasksByProtocolDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TasksByProtocol"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"protocolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tasksByProtocol"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"protocolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"protocolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"membershipId"}},{"kind":"Field","name":{"kind":"Name","value":"membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"userEmail"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<TasksByProtocolQuery, TasksByProtocolQueryVariables>;
export const ProtocolTemplatesByOrgDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProtocolTemplatesByOrg"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"protocolTemplatesByOrg"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"agendaItems"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"no"}},{"kind":"Field","name":{"kind":"Name","value":"topic"}},{"kind":"Field","name":{"kind":"Name","value":"goal"}}]}},{"kind":"Field","name":{"kind":"Name","value":"defaultParticipantMembershipIds"}},{"kind":"Field","name":{"kind":"Name","value":"usedCount"}}]}}]}}]} as unknown as DocumentNode<ProtocolTemplatesByOrgQuery, ProtocolTemplatesByOrgQueryVariables>;
export const ProtocolByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProtocolById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"protocolById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"meetingDate"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"externalParticipants"}},{"kind":"Field","name":{"kind":"Name","value":"createdByMembershipId"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"participants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"membershipId"}},{"kind":"Field","name":{"kind":"Name","value":"membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"userEmail"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"sections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agendaItems"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"no"}},{"kind":"Field","name":{"kind":"Name","value":"topic"}},{"kind":"Field","name":{"kind":"Name","value":"goal"}}]}},{"kind":"Field","name":{"kind":"Name","value":"decisions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"topic"}},{"kind":"Field","name":{"kind":"Name","value":"decision"}},{"kind":"Field","name":{"kind":"Name","value":"responsible"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"communications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"topic"}},{"kind":"Field","name":{"kind":"Name","value":"audience"}},{"kind":"Field","name":{"kind":"Name","value":"responsible"}},{"kind":"Field","name":{"kind":"Name","value":"channel"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"infoPoints"}},{"kind":"Field","name":{"kind":"Name","value":"challenges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"topic"}},{"kind":"Field","name":{"kind":"Name","value":"challenge"}},{"kind":"Field","name":{"kind":"Name","value":"supportNeeded"}}]}},{"kind":"Field","name":{"kind":"Name","value":"openPoints"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"topic"}},{"kind":"Field","name":{"kind":"Name","value":"nextStep"}},{"kind":"Field","name":{"kind":"Name","value":"forNextMeeting"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ProtocolByIdQuery, ProtocolByIdQueryVariables>;
export const ProtocolsByOrgDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProtocolsByOrg"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"protocolsByOrg"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"meetingDate"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"participants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<ProtocolsByOrgQuery, ProtocolsByOrgQueryVariables>;
export const ProjectTemplateByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectTemplateById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectTemplateById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"tasks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"dueOffsetDays"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectTemplateByIdQuery, ProjectTemplateByIdQueryVariables>;
export const ProjectTemplatesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectTemplates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectTemplates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"tasks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectTemplatesQuery, ProjectTemplatesQueryVariables>;
export const AddProjectMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddProjectMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddProjectMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addProjectMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AddProjectMemberMutation, AddProjectMemberMutationVariables>;
export const UpdateProjectMemberRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProjectMemberRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateProjectMemberRoleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProjectMemberRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]} as unknown as DocumentNode<UpdateProjectMemberRoleMutation, UpdateProjectMemberRoleMutationVariables>;
export const RemoveProjectMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveProjectMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeProjectMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<RemoveProjectMemberMutation, RemoveProjectMemberMutationVariables>;
export const CreateProtocolTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProtocolTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateProtocolTemplateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createProtocolTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"agendaItems"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"no"}},{"kind":"Field","name":{"kind":"Name","value":"topic"}},{"kind":"Field","name":{"kind":"Name","value":"goal"}}]}},{"kind":"Field","name":{"kind":"Name","value":"defaultParticipantMembershipIds"}},{"kind":"Field","name":{"kind":"Name","value":"usedCount"}}]}}]}}]} as unknown as DocumentNode<CreateProtocolTemplateMutation, CreateProtocolTemplateMutationVariables>;
export const UpdateProtocolTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProtocolTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateProtocolTemplateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProtocolTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateProtocolTemplateMutation, UpdateProtocolTemplateMutationVariables>;
export const DeleteProtocolTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteProtocolTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteProtocolTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteProtocolTemplateMutation, DeleteProtocolTemplateMutationVariables>;
export const SaveProtocolAsTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SaveProtocolAsTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SaveProtocolAsTemplateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saveProtocolAsTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<SaveProtocolAsTemplateMutation, SaveProtocolAsTemplateMutationVariables>;
export const CreateProtocolDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProtocol"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateProtocolInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createProtocol"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateProtocolMutation, CreateProtocolMutationVariables>;
export const UpdateProtocolDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProtocol"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateProtocolInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProtocol"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateProtocolMutation, UpdateProtocolMutationVariables>;
export const DeleteProtocolDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteProtocol"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteProtocol"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteProtocolMutation, DeleteProtocolMutationVariables>;
export const CreateTaskDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTask"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTaskInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTask"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateTaskMutation, CreateTaskMutationVariables>;
export const UpdateTaskDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTask"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTaskInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTask"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateTaskMutation, UpdateTaskMutationVariables>;
export const MoveTaskDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MoveTask"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MoveTaskInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"moveTask"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]}}]} as unknown as DocumentNode<MoveTaskMutation, MoveTaskMutationVariables>;
export const DeleteTaskDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTask"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTask"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteTaskMutation, DeleteTaskMutationVariables>;
export const CreateProjectTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProjectTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateProjectTemplateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createProjectTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateProjectTemplateMutation, CreateProjectTemplateMutationVariables>;
export const UpdateProjectTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProjectTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateProjectTemplateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProjectTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateProjectTemplateMutation, UpdateProjectTemplateMutationVariables>;
export const DeleteProjectTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteProjectTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteProjectTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteProjectTemplateMutation, DeleteProjectTemplateMutationVariables>;
export const CreatePersonalTaskDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreatePersonalTask"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTaskInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTask"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreatePersonalTaskMutation, CreatePersonalTaskMutationVariables>;
export const UpdatePersonalTaskDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdatePersonalTask"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTaskInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTask"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdatePersonalTaskMutation, UpdatePersonalTaskMutationVariables>;
export const ReorderMyTasksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReorderMyTasks"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderedTaskIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reorderMyTasks"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderedTaskIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderedTaskIds"}}}]}]}}]} as unknown as DocumentNode<ReorderMyTasksMutation, ReorderMyTasksMutationVariables>;
export const SaveProjectAsTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SaveProjectAsTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SaveProjectAsTemplateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saveProjectAsTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<SaveProjectAsTemplateMutation, SaveProjectAsTemplateMutationVariables>;
export const UpdateProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateProjectInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateProjectMutation, UpdateProjectMutationVariables>;
export const UpdateTaskStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTaskStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTaskInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTask"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<UpdateTaskStatusMutation, UpdateTaskStatusMutationVariables>;
export const GetRecordKeepingSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRecordKeepingSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recordKeepingSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"introducedStuckDays"}},{"kind":"Field","name":{"kind":"Name","value":"practicedStuckDays"}},{"kind":"Field","name":{"kind":"Name","value":"bigGapDays"}}]}}]}}]} as unknown as DocumentNode<GetRecordKeepingSettingsQuery, GetRecordKeepingSettingsQueryVariables>;
export const UpdateRecordKeepingSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateRecordKeepingSettings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateRecordKeepingSettingsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRecordKeepingSettings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"introducedStuckDays"}},{"kind":"Field","name":{"kind":"Name","value":"practicedStuckDays"}},{"kind":"Field","name":{"kind":"Name","value":"bigGapDays"}}]}}]}}]} as unknown as DocumentNode<UpdateRecordKeepingSettingsMutation, UpdateRecordKeepingSettingsMutationVariables>;
export const CreateLessonRecordsBulkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateLessonRecordsBulk"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateLessonRecordsBulkInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createLessonRecordsBulk"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"lessonId"}},{"kind":"Field","name":{"kind":"Name","value":"recordedAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}}]}}]} as unknown as DocumentNode<CreateLessonRecordsBulkMutation, CreateLessonRecordsBulkMutationVariables>;
export const GetAreaLessonCountsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAreaLessonCounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"areaLessonCountsByOrg"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"areaId"}},{"kind":"Field","name":{"kind":"Name","value":"lessonCount"}},{"kind":"Field","name":{"kind":"Name","value":"curriculumId"}},{"kind":"Field","name":{"kind":"Name","value":"curriculumName"}}]}}]}}]} as unknown as DocumentNode<GetAreaLessonCountsQuery, GetAreaLessonCountsQueryVariables>;
export const ClassroomAttentionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ClassroomAttention"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolClassId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locale"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"classroomAttentionSummaries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolClassId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolClassId"}}},{"kind":"Argument","name":{"kind":"Name","value":"locale"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locale"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"totalSignals"}},{"kind":"Field","name":{"kind":"Name","value":"byReason"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"NEEDS_MORE_CURRENT"}},{"kind":"Field","name":{"kind":"Name","value":"REPEATED_NEEDS_MORE"}},{"kind":"Field","name":{"kind":"Name","value":"STUCK_PRACTICED"}},{"kind":"Field","name":{"kind":"Name","value":"STUCK_INTRODUCED"}},{"kind":"Field","name":{"kind":"Name","value":"BIG_GAP_INTRO_TO_PRACTICED"}}]}},{"kind":"Field","name":{"kind":"Name","value":"topItems"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lessonId"}},{"kind":"Field","name":{"kind":"Name","value":"lessonName"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"severity"}},{"kind":"Field","name":{"kind":"Name","value":"days"}},{"kind":"Field","name":{"kind":"Name","value":"since"}},{"kind":"Field","name":{"kind":"Name","value":"ancestors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nodeType"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<ClassroomAttentionQuery, ClassroomAttentionQueryVariables>;
export const ClassroomEngagementTimelineDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ClassroomEngagementTimeline"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolClassId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"from"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"to"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"granularity"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TimelineGranularity"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"classroomEngagementTimeline"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolClassId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolClassId"}}},{"kind":"Argument","name":{"kind":"Name","value":"from"},"value":{"kind":"Variable","name":{"kind":"Name","value":"from"}}},{"kind":"Argument","name":{"kind":"Name","value":"to"},"value":{"kind":"Variable","name":{"kind":"Name","value":"to"}}},{"kind":"Argument","name":{"kind":"Name","value":"granularity"},"value":{"kind":"Variable","name":{"kind":"Name","value":"granularity"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"buckets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bucketStart"}},{"kind":"Field","name":{"kind":"Name","value":"focused"}},{"kind":"Field","name":{"kind":"Name","value":"interested"}},{"kind":"Field","name":{"kind":"Name","value":"mechanical"}},{"kind":"Field","name":{"kind":"Name","value":"resistant"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalObserved"}}]}}]}}]} as unknown as DocumentNode<ClassroomEngagementTimelineQuery, ClassroomEngagementTimelineQueryVariables>;
export const ClassroomHeatmapDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ClassroomHeatmapData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolClassId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locale"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"classroomHeatmapData"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolClassId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolClassId"}}},{"kind":"Argument","name":{"kind":"Name","value":"locale"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locale"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"students"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"areas"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"areaId"}},{"kind":"Field","name":{"kind":"Name","value":"areaName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cells"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"areaId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}}]}}]} as unknown as DocumentNode<ClassroomHeatmapDataQuery, ClassroomHeatmapDataQueryVariables>;
export const GetClassroomStudentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetClassroomStudents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolClassId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeEnrollmentsBySchoolClassId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolClassId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolClassId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"student"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}}]} as unknown as DocumentNode<GetClassroomStudentsQuery, GetClassroomStudentsQueryVariables>;
export const GetLessonPrerequisitesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetLessonPrerequisites"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"lessonId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lessonPrerequisites"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"lessonId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"lessonId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"lessonType"}},{"kind":"Field","name":{"kind":"Name","value":"lessonScale"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetLessonPrerequisitesQuery, GetLessonPrerequisitesQueryVariables>;
export const GetLessonsForRecordKeepingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetLessonsForRecordKeeping"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lessonsByOrg"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"includeArchived"},"value":{"kind":"BooleanValue","value":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"lessonType"}},{"kind":"Field","name":{"kind":"Name","value":"lessonScale"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"ancestors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nodeType"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetLessonsForRecordKeepingQuery, GetLessonsForRecordKeepingQueryVariables>;
export const NextLessonsForStudentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"NextLessonsForStudent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nextLessonsForStudent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"lessonType"}},{"kind":"Field","name":{"kind":"Name","value":"lessonScale"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<NextLessonsForStudentQuery, NextLessonsForStudentQueryVariables>;
export const GetOrgAreasDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrgAreas"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"areasByOrg"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"includeArchived"},"value":{"kind":"BooleanValue","value":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"nodeType"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetOrgAreasQuery, GetOrgAreasQueryVariables>;
export const GetStudentLessonRecordsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetStudentLessonRecords"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"LessonRecordsFilterInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lessonRecords"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"lessonId"}},{"kind":"Field","name":{"kind":"Name","value":"recordedAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"note"}},{"kind":"Field","name":{"kind":"Name","value":"engagement"}},{"kind":"Field","name":{"kind":"Name","value":"difficulty"}},{"kind":"Field","name":{"kind":"Name","value":"socialForm"}},{"kind":"Field","name":{"kind":"Name","value":"selfAssessment"}},{"kind":"Field","name":{"kind":"Name","value":"selfAssessmentByChild"}},{"kind":"Field","name":{"kind":"Name","value":"lessonClarityConfirmed"}},{"kind":"Field","name":{"kind":"Name","value":"selfConfidence"}},{"kind":"Field","name":{"kind":"Name","value":"persistence"}},{"kind":"Field","name":{"kind":"Name","value":"concentration"}},{"kind":"Field","name":{"kind":"Name","value":"lesson"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"ancestors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nodeType"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"recordedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}}]} as unknown as DocumentNode<GetStudentLessonRecordsQuery, GetStudentLessonRecordsQueryVariables>;
export const StudentLessonRecordTimelineDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentLessonRecordTimeline"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"from"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"to"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"granularity"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TimelineGranularity"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentLessonRecordTimeline"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"from"},"value":{"kind":"Variable","name":{"kind":"Name","value":"from"}}},{"kind":"Argument","name":{"kind":"Name","value":"to"},"value":{"kind":"Variable","name":{"kind":"Name","value":"to"}}},{"kind":"Argument","name":{"kind":"Name","value":"granularity"},"value":{"kind":"Variable","name":{"kind":"Name","value":"granularity"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"buckets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bucketStart"}},{"kind":"Field","name":{"kind":"Name","value":"planning"}},{"kind":"Field","name":{"kind":"Name","value":"introduced"}},{"kind":"Field","name":{"kind":"Name","value":"practiced"}},{"kind":"Field","name":{"kind":"Name","value":"mastered"}},{"kind":"Field","name":{"kind":"Name","value":"needsMore"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalIntroductionsInRange"}},{"kind":"Field","name":{"kind":"Name","value":"daysSinceLastIntroduction"}}]}}]}}]} as unknown as DocumentNode<StudentLessonRecordTimelineQuery, StudentLessonRecordTimelineQueryVariables>;
export const SetLessonPrerequisitesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetLessonPrerequisites"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SetLessonPrerequisitesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setLessonPrerequisites"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<SetLessonPrerequisitesMutation, SetLessonPrerequisitesMutationVariables>;
export const UpdateLessonRecordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateLessonRecord"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateLessonRecordInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateLessonRecord"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"lessonId"}},{"kind":"Field","name":{"kind":"Name","value":"recordedAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}}]}}]} as unknown as DocumentNode<UpdateLessonRecordMutation, UpdateLessonRecordMutationVariables>;
export const DeleteRetentionPolicyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteRetentionPolicy"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteRetentionPolicy"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteRetentionPolicyMutation, DeleteRetentionPolicyMutationVariables>;
export const ExecutePurgeCandidateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ExecutePurgeCandidate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"executePurgeCandidate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<ExecutePurgeCandidateMutation, ExecutePurgeCandidateMutationVariables>;
export const PurgeCandidatesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PurgeCandidates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purgeCandidates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"entityType"}},{"kind":"Field","name":{"kind":"Name","value":"subjectLabel"}},{"kind":"Field","name":{"kind":"Name","value":"dueSince"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"executedAt"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}}]}}]} as unknown as DocumentNode<PurgeCandidatesQuery, PurgeCandidatesQueryVariables>;
export const RetentionPoliciesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RetentionPolicies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"retentionPolicies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"entityType"}},{"kind":"Field","name":{"kind":"Name","value":"retentionMonths"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"dueCount"}}]}}]}}]} as unknown as DocumentNode<RetentionPoliciesQuery, RetentionPoliciesQueryVariables>;
export const ReviewPurgeCandidateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReviewPurgeCandidate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"approve"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reviewPurgeCandidate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"approve"},"value":{"kind":"Variable","name":{"kind":"Name","value":"approve"}}}]}]}}]} as unknown as DocumentNode<ReviewPurgeCandidateMutation, ReviewPurgeCandidateMutationVariables>;
export const ScanRetentionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ScanRetention"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scanRetention"}}]}}]} as unknown as DocumentNode<ScanRetentionMutation, ScanRetentionMutationVariables>;
export const UpsertRetentionPolicyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertRetentionPolicy"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpsertRetentionPolicyInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertRetentionPolicy"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpsertRetentionPolicyMutation, UpsertRetentionPolicyMutationVariables>;
export const GetPermissionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPermissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<GetPermissionsQuery, GetPermissionsQueryVariables>;
export const GetRolesByOrgIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRolesByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rolesByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemCode"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetRolesByOrgIdQuery, GetRolesByOrgIdQueryVariables>;
export const UpdateRolePermissionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateRolePermissions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateRolePermissionsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRolePermissions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateRolePermissionsMutation, UpdateRolePermissionsMutationVariables>;
export const CreateSchoolClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateSchoolClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSchoolClassInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSchoolClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateSchoolClassMutation, CreateSchoolClassMutationVariables>;
export const DeleteSchoolClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteSchoolClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteSchoolClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteSchoolClassMutation, DeleteSchoolClassMutationVariables>;
export const GetMyTeachingSchoolClassesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMyTeachingSchoolClasses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myTeachingSchoolClasses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gradeLevels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teachers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"maxCapacity"}},{"kind":"Field","name":{"kind":"Name","value":"room"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]} as unknown as DocumentNode<GetMyTeachingSchoolClassesQuery, GetMyTeachingSchoolClassesQueryVariables>;
export const GetSchoolClassByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSchoolClassById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schoolClassById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gradeLevels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teachers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"maxCapacity"}},{"kind":"Field","name":{"kind":"Name","value":"room"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]} as unknown as DocumentNode<GetSchoolClassByIdQuery, GetSchoolClassByIdQueryVariables>;
export const GetSchoolClassesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSchoolClasses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schoolClassesByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gradeLevels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ageMin"}},{"kind":"Field","name":{"kind":"Name","value":"ageMax"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teachers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"maxCapacity"}},{"kind":"Field","name":{"kind":"Name","value":"room"}},{"kind":"Field","name":{"kind":"Name","value":"enrolledCount"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]} as unknown as DocumentNode<GetSchoolClassesQuery, GetSchoolClassesQueryVariables>;
export const GetTeachersByOrgIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTeachersByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teachersByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetTeachersByOrgIdQuery, GetTeachersByOrgIdQueryVariables>;
export const ReorderSchoolClassesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReorderSchoolClasses"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ReorderSchoolClassesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reorderSchoolClasses"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]}}]} as unknown as DocumentNode<ReorderSchoolClassesMutation, ReorderSchoolClassesMutationVariables>;
export const UpdateSchoolClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSchoolClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSchoolClassInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSchoolClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateSchoolClassMutation, UpdateSchoolClassMutationVariables>;
export const CreateStudentNoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateStudentNote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createStudentNoteInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateStudentNoteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createStudentNote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createStudentNoteInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createStudentNoteInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateStudentNoteMutation, CreateStudentNoteMutationVariables>;
export const GetStudentNotesByStudentIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetStudentNotesByStudentId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentNotesByStudentId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"isConfidential"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"authorMembership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetStudentNotesByStudentIdQuery, GetStudentNotesByStudentIdQueryVariables>;
export const KanbanSchoolClassesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"KanbanSchoolClasses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schoolClassesByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"maxCapacity"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"gradeLevels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<KanbanSchoolClassesQuery, KanbanSchoolClassesQueryVariables>;
export const KanbanUnassignedStudentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"KanbanUnassignedStudents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unassignedStudents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]} as unknown as DocumentNode<KanbanUnassignedStudentsQuery, KanbanUnassignedStudentsQueryVariables>;
export const KanbanClassroomStudentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"KanbanClassroomStudents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolClassId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeEnrollmentsBySchoolClassId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolClassId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolClassId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"student"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}}]} as unknown as DocumentNode<KanbanClassroomStudentsQuery, KanbanClassroomStudentsQueryVariables>;
export const TransferStudentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TransferStudent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TransferStudentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transferStudentToSchoolClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<TransferStudentMutation, TransferStudentMutationVariables>;
export const CreateStudentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateStudent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateStudentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createStudent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateStudentMutation, CreateStudentMutationVariables>;
export const DeleteStudentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteStudent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteStudent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteStudentMutation, DeleteStudentMutationVariables>;
export const GetStudentByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetStudentById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"dateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"enrollmentDate"}},{"kind":"Field","name":{"kind":"Name","value":"exitDate"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]} as unknown as DocumentNode<GetStudentByIdQuery, GetStudentByIdQueryVariables>;
export const GetEnrollmentsByStudentIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEnrollmentsByStudentId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enrollmentsByStudentId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"enrolledAt"}},{"kind":"Field","name":{"kind":"Name","value":"leftAt"}},{"kind":"Field","name":{"kind":"Name","value":"schoolClass"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gradeLevels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetEnrollmentsByStudentIdQuery, GetEnrollmentsByStudentIdQueryVariables>;
export const GetStudentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetStudents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentsByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"dateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"exitDate"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"currentClass"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"gradeLevels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetStudentsQuery, GetStudentsQueryVariables>;
export const UpdateEnrollmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateEnrollment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSchoolClassEnrollmentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateEnrollment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateEnrollmentMutation, UpdateEnrollmentMutationVariables>;
export const UpdateStudentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateStudent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateStudentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateStudent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateStudentMutation, UpdateStudentMutationVariables>;
export const AddTeamMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddTeamMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTeamMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTeamMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]} as unknown as DocumentNode<AddTeamMemberMutation, AddTeamMemberMutationVariables>;
export const CreateTeamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTeam"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTeamInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTeam"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}}]}}]}}]} as unknown as DocumentNode<CreateTeamMutation, CreateTeamMutationVariables>;
export const DeleteTeamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTeam"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTeam"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteTeamMutation, DeleteTeamMutationVariables>;
export const GetAllTeamMembersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAllTeamMembers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamMembersByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"employee"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"userEmails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetAllTeamMembersQuery, GetAllTeamMembersQueryVariables>;
export const GetTeamByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTeamById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GetTeamByIdQuery, GetTeamByIdQueryVariables>;
export const GetTeamMembersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTeamMembers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamMembersByTeamId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"employee"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"userEmails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetTeamMembersQuery, GetTeamMembersQueryVariables>;
export const GetTeamsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTeams"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamsByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}}]}}]}}]} as unknown as DocumentNode<GetTeamsQuery, GetTeamsQueryVariables>;
export const MoveTeamMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MoveTeamMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTeamMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTeamMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]} as unknown as DocumentNode<MoveTeamMemberMutation, MoveTeamMemberMutationVariables>;
export const RemoveTeamMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveTeamMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTeamMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<RemoveTeamMemberMutation, RemoveTeamMemberMutationVariables>;
export const ReorderTeamsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReorderTeams"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ReorderTeamsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reorderTeams"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}}]}}]}}]} as unknown as DocumentNode<ReorderTeamsMutation, ReorderTeamsMutationVariables>;
export const UpdateTeamMemberRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTeamMemberRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTeamMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTeamMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]} as unknown as DocumentNode<UpdateTeamMemberRoleMutation, UpdateTeamMemberRoleMutationVariables>;
export const UpdateTeamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTeam"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTeamInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTeam"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<UpdateTeamMutation, UpdateTeamMutationVariables>;
export const MyEmployeeIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyEmployeeId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myEmployeeId"}}]}}]} as unknown as DocumentNode<MyEmployeeIdQuery, MyEmployeeIdQueryVariables>;
export const MyTimeTrackingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyTimeTracking"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"from"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"to"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myWorkTimeBalance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"from"},"value":{"kind":"Variable","name":{"kind":"Name","value":"from"}}},{"kind":"Argument","name":{"kind":"Name","value":"to"},"value":{"kind":"Variable","name":{"kind":"Name","value":"to"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeeId"}},{"kind":"Field","name":{"kind":"Name","value":"fromDate"}},{"kind":"Field","name":{"kind":"Name","value":"toDate"}},{"kind":"Field","name":{"kind":"Name","value":"plannedMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"workedMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"vacationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"absenceMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"actualMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"differenceMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"openingWorkMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"paidOvertimeMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"netBalanceMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"vacationDaysUsed"}},{"kind":"Field","name":{"kind":"Name","value":"absenceDaysCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"myVacationBalance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"from"},"value":{"kind":"Variable","name":{"kind":"Name","value":"from"}}},{"kind":"Argument","name":{"kind":"Name","value":"to"},"value":{"kind":"Variable","name":{"kind":"Name","value":"to"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"entitlementDays"}},{"kind":"Field","name":{"kind":"Name","value":"openingDays"}},{"kind":"Field","name":{"kind":"Name","value":"usedDays"}},{"kind":"Field","name":{"kind":"Name","value":"remainingDays"}}]}},{"kind":"Field","name":{"kind":"Name","value":"myMissingRecordDays"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"from"},"value":{"kind":"Variable","name":{"kind":"Name","value":"from"}}},{"kind":"Argument","name":{"kind":"Name","value":"to"},"value":{"kind":"Variable","name":{"kind":"Name","value":"to"}}}]},{"kind":"Field","name":{"kind":"Name","value":"timeTrackingByEmployeeId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"employeeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"from"},"value":{"kind":"Variable","name":{"kind":"Name","value":"from"}}},{"kind":"Argument","name":{"kind":"Name","value":"to"},"value":{"kind":"Variable","name":{"kind":"Name","value":"to"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"endedAt"}},{"kind":"Field","name":{"kind":"Name","value":"breakMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"workMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"entryDate"}},{"kind":"Field","name":{"kind":"Name","value":"source"}}]}}]}}]} as unknown as DocumentNode<MyTimeTrackingQuery, MyTimeTrackingQueryVariables>;
export const TeamOverviewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeamOverview"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"from"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"to"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamWorkTimeOverview"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"from"},"value":{"kind":"Variable","name":{"kind":"Name","value":"from"}}},{"kind":"Argument","name":{"kind":"Name","value":"to"},"value":{"kind":"Variable","name":{"kind":"Name","value":"to"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeeId"}},{"kind":"Field","name":{"kind":"Name","value":"employeeName"}},{"kind":"Field","name":{"kind":"Name","value":"netBalanceMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"vacationDaysUsed"}}]}}]}}]} as unknown as DocumentNode<TeamOverviewQuery, TeamOverviewQueryVariables>;
export const EmployeeReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EmployeeReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"from"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"to"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locale"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeeMissingRecordDays"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"employeeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"from"},"value":{"kind":"Variable","name":{"kind":"Name","value":"from"}}},{"kind":"Argument","name":{"kind":"Name","value":"to"},"value":{"kind":"Variable","name":{"kind":"Name","value":"to"}}}]},{"kind":"Field","name":{"kind":"Name","value":"employeeAbsenceCategorySummary"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"employeeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"from"},"value":{"kind":"Variable","name":{"kind":"Name","value":"from"}}},{"kind":"Argument","name":{"kind":"Name","value":"to"},"value":{"kind":"Variable","name":{"kind":"Name","value":"to"}}},{"kind":"Argument","name":{"kind":"Name","value":"locale"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locale"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"fullDays"}},{"kind":"Field","name":{"kind":"Name","value":"partialDays"}},{"kind":"Field","name":{"kind":"Name","value":"totalDays"}}]}},{"kind":"Field","name":{"kind":"Name","value":"employeeWorkTimeBalance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"employeeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"from"},"value":{"kind":"Variable","name":{"kind":"Name","value":"from"}}},{"kind":"Argument","name":{"kind":"Name","value":"to"},"value":{"kind":"Variable","name":{"kind":"Name","value":"to"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeeId"}},{"kind":"Field","name":{"kind":"Name","value":"plannedMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"workedMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"vacationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"absenceMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"differenceMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"openingWorkMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"paidOvertimeMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"netBalanceMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"vacationDaysUsed"}},{"kind":"Field","name":{"kind":"Name","value":"absenceDaysCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"employeeVacationBalance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"employeeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"from"},"value":{"kind":"Variable","name":{"kind":"Name","value":"from"}}},{"kind":"Argument","name":{"kind":"Name","value":"to"},"value":{"kind":"Variable","name":{"kind":"Name","value":"to"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"entitlementDays"}},{"kind":"Field","name":{"kind":"Name","value":"openingDays"}},{"kind":"Field","name":{"kind":"Name","value":"usedDays"}},{"kind":"Field","name":{"kind":"Name","value":"remainingDays"}}]}},{"kind":"Field","name":{"kind":"Name","value":"employeeMonthlyWorkTime"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"employeeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"from"},"value":{"kind":"Variable","name":{"kind":"Name","value":"from"}}},{"kind":"Argument","name":{"kind":"Name","value":"to"},"value":{"kind":"Variable","name":{"kind":"Name","value":"to"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"year"}},{"kind":"Field","name":{"kind":"Name","value":"month"}},{"kind":"Field","name":{"kind":"Name","value":"plannedMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"actualMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"differenceMinutes"}}]}}]}}]} as unknown as DocumentNode<EmployeeReportQuery, EmployeeReportQueryVariables>;
export const CreateTimeTrackingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTimeTracking"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTimeTrackingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTimeTracking"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateTimeTrackingMutation, CreateTimeTrackingMutationVariables>;
export const UpdateTimeTrackingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTimeTracking"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTimeTrackingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTimeTracking"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateTimeTrackingMutation, UpdateTimeTrackingMutationVariables>;
export const DeleteTimeTrackingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTimeTracking"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTimeTracking"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteTimeTrackingMutation, DeleteTimeTrackingMutationVariables>;
export const StartTimeTrackingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StartTimeTracking"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startTimeTracking"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"employeeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<StartTimeTrackingMutation, StartTimeTrackingMutationVariables>;
export const StopTimeTrackingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StopTimeTracking"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stopTimeTracking"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"employeeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<StopTimeTrackingMutation, StopTimeTrackingMutationVariables>;
export const EmployeePeriodOpeningBalancesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EmployeePeriodOpeningBalances"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeePeriodOpeningBalances"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"employeeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"employeeId"}},{"kind":"Field","name":{"kind":"Name","value":"periodId"}},{"kind":"Field","name":{"kind":"Name","value":"openingWorkMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"openingVacationDays"}}]}}]}}]} as unknown as DocumentNode<EmployeePeriodOpeningBalancesQuery, EmployeePeriodOpeningBalancesQueryVariables>;
export const UpsertEmployeePeriodOpeningBalanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertEmployeePeriodOpeningBalance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpsertEmployeePeriodOpeningBalanceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertEmployeePeriodOpeningBalance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpsertEmployeePeriodOpeningBalanceMutation, UpsertEmployeePeriodOpeningBalanceMutationVariables>;
export const DeleteEmployeePeriodOpeningBalanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteEmployeePeriodOpeningBalance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteEmployeePeriodOpeningBalance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteEmployeePeriodOpeningBalanceMutation, DeleteEmployeePeriodOpeningBalanceMutationVariables>;
export const EmployeePaidOvertimeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EmployeePaidOvertime"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeePaidOvertime"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"employeeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"employeeId"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"minutes"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}}]}}]} as unknown as DocumentNode<EmployeePaidOvertimeQuery, EmployeePaidOvertimeQueryVariables>;
export const CreateEmployeePaidOvertimeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateEmployeePaidOvertime"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEmployeePaidOvertimeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEmployeePaidOvertime"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateEmployeePaidOvertimeMutation, CreateEmployeePaidOvertimeMutationVariables>;
export const UpdateEmployeePaidOvertimeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateEmployeePaidOvertime"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateEmployeePaidOvertimeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateEmployeePaidOvertime"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateEmployeePaidOvertimeMutation, UpdateEmployeePaidOvertimeMutationVariables>;
export const DeleteEmployeePaidOvertimeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteEmployeePaidOvertime"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteEmployeePaidOvertime"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteEmployeePaidOvertimeMutation, DeleteEmployeePaidOvertimeMutationVariables>;
export const TimeTrackingPeriodsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TimeTrackingPeriods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"timeTrackingPeriods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<TimeTrackingPeriodsQuery, TimeTrackingPeriodsQueryVariables>;
export const EnsureTimeTrackingPeriodDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EnsureTimeTrackingPeriod"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ensureTimeTrackingPeriod"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}}]}}]} as unknown as DocumentNode<EnsureTimeTrackingPeriodMutation, EnsureTimeTrackingPeriodMutationVariables>;
export const SetTimeTrackingPeriodStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetTimeTrackingPeriodStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TimeTrackingPeriodStatus"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setTimeTrackingPeriodStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<SetTimeTrackingPeriodStatusMutation, SetTimeTrackingPeriodStatusMutationVariables>;
export const TimeTrackingSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TimeTrackingSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"holidays"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"paidPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"canton"}}]}},{"kind":"Field","name":{"kind":"Name","value":"companyVacations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"appliesToAll"}}]}}]}}]} as unknown as DocumentNode<TimeTrackingSettingsQuery, TimeTrackingSettingsQueryVariables>;
export const CreateHolidayDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateHoliday"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateHolidayInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createHoliday"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateHolidayMutation, CreateHolidayMutationVariables>;
export const DeleteHolidayDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteHoliday"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteHoliday"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteHolidayMutation, DeleteHolidayMutationVariables>;
export const CreateCompanyVacationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCompanyVacation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCompanyVacationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCompanyVacation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateCompanyVacationMutation, CreateCompanyVacationMutationVariables>;
export const DeleteCompanyVacationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteCompanyVacation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteCompanyVacation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteCompanyVacationMutation, DeleteCompanyVacationMutationVariables>;
export const AddUserEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddUserEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addUserEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"isVerified"}}]}}]}}]} as unknown as DocumentNode<AddUserEmailMutation, AddUserEmailMutationVariables>;
export const ChangeUserEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ChangeUserEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChangeUserEmailInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"changeUserEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userEmails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"isVerified"}}]}}]}}]}}]} as unknown as DocumentNode<ChangeUserEmailMutation, ChangeUserEmailMutationVariables>;
export const CreateUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createUserInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createUserInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createUserInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateUserMutation, CreateUserMutationVariables>;
export const GetAuthContextDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAuthContext"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authContext"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"userEmails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"isVerified"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"roles"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"orgId"}},{"kind":"Field","name":{"kind":"Name","value":"orgName"}},{"kind":"Field","name":{"kind":"Name","value":"persona"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"isSuperAdmin"}},{"kind":"Field","name":{"kind":"Name","value":"timeTrackingEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"isProjectMember"}}]}}]}}]} as unknown as DocumentNode<GetAuthContextQuery, GetAuthContextQueryVariables>;
export const RolesByOrganizationIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RolesByOrganizationId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rolesByOrganizationId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemCode"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}}]}}]}}]} as unknown as DocumentNode<RolesByOrganizationIdQuery, RolesByOrganizationIdQueryVariables>;
export const GetUserByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"dateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"isSuperAdmin"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"userEmails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"isVerified"}}]}},{"kind":"Field","name":{"kind":"Name","value":"memberships"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"persona"}},{"kind":"Field","name":{"kind":"Name","value":"contactPhone"}},{"kind":"Field","name":{"kind":"Name","value":"userEmailId"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetUserByIdQuery, GetUserByIdQueryVariables>;
export const GetUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"isSuperAdmin"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"userEmails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"isVerified"}},{"kind":"Field","name":{"kind":"Name","value":"authAccounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"memberships"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"persona"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetUsersQuery, GetUsersQueryVariables>;
export const RemoveUserEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveUserEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeUserEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<RemoveUserEmailMutation, RemoveUserEmailMutationVariables>;
export const SetPrimaryUserEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetPrimaryUserEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setPrimaryUserEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}}]}}]}}]} as unknown as DocumentNode<SetPrimaryUserEmailMutation, SetPrimaryUserEmailMutationVariables>;
export const UpdateMyThemeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateMyTheme"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateMyThemeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMyTheme"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<UpdateMyThemeMutation, UpdateMyThemeMutationVariables>;
export const UpdateUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateUserInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateUserInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateUserInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateUserMutation, UpdateUserMutationVariables>;
export const ArchiveProcessingActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchiveProcessingActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archiveProcessingActivity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<ArchiveProcessingActivityMutation, ArchiveProcessingActivityMutationVariables>;
export const ArchiveSubprocessorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchiveSubprocessor"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archiveSubprocessor"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<ArchiveSubprocessorMutation, ArchiveSubprocessorMutationVariables>;
export const ProcessingActivitiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProcessingActivities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"processingActivities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"legalBasis"}},{"kind":"Field","name":{"kind":"Name","value":"dataCategories"}},{"kind":"Field","name":{"kind":"Name","value":"dataSubjects"}},{"kind":"Field","name":{"kind":"Name","value":"recipients"}},{"kind":"Field","name":{"kind":"Name","value":"retentionNote"}}]}}]}}]} as unknown as DocumentNode<ProcessingActivitiesQuery, ProcessingActivitiesQueryVariables>;
export const SubprocessorsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Subprocessors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"subprocessors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"dpaSigned"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}}]}}]}}]} as unknown as DocumentNode<SubprocessorsQuery, SubprocessorsQueryVariables>;
export const CreateProcessingActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProcessingActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateProcessingActivityInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createProcessingActivity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateProcessingActivityMutation, CreateProcessingActivityMutationVariables>;
export const UpdateProcessingActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProcessingActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateProcessingActivityInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProcessingActivity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateProcessingActivityMutation, UpdateProcessingActivityMutationVariables>;
export const CreateSubprocessorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateSubprocessor"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSubprocessorInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSubprocessor"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateSubprocessorMutation, CreateSubprocessorMutationVariables>;
export const UpdateSubprocessorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSubprocessor"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSubprocessorInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSubprocessor"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateSubprocessorMutation, UpdateSubprocessorMutationVariables>;