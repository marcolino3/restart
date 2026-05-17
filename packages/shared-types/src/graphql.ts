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

export type AdmissionStage = {
  __typename?: 'AdmissionStage';
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
  isSuperAdmin: Scalars['Boolean']['output'];
  orgId?: Maybe<Scalars['String']['output']>;
  permissions: Array<Scalars['String']['output']>;
  roles: Array<Scalars['String']['output']>;
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

export type ClassroomHeatmapDataOutput = {
  __typename?: 'ClassroomHeatmapDataOutput';
  areas: Array<HeatmapAreaOutput>;
  cells: Array<HeatmapCellOutput>;
  students: Array<HeatmapStudentOutput>;
};

export type ContactPerson = {
  __typename?: 'ContactPerson';
  address?: Maybe<Address>;
  addressId?: Maybe<Scalars['ID']['output']>;
  createdAt: Scalars['DateTime']['output'];
  dateOfBirth?: Maybe<Scalars['String']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  email?: Maybe<Scalars['String']['output']>;
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

export type CreateAdmissionStageInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  position?: InputMaybe<Scalars['Int']['input']>;
  slug: Scalars['String']['input'];
  stageType?: InputMaybe<AdmissionStageType>;
};

export type CreateContactPersonInput = {
  addressId?: InputMaybe<Scalars['ID']['input']>;
  dateOfBirth?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
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

export type CreateEmployeeAbsenceNoticeInput = {
  absenceCategoryId: Scalars['ID']['input'];
  endDate?: InputMaybe<Scalars['String']['input']>;
  isTeamInformed: Scalars['Boolean']['input'];
  note: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
};

export type CreateEmployeeContractInput = {
  annualVacationDays?: InputMaybe<Scalars['Int']['input']>;
  contractType?: InputMaybe<EmployeeContractType>;
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

export type CreateGradeLevelInput = {
  name: Scalars['String']['input'];
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
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

export type CreateTeamInput = {
  name: Scalars['String']['input'];
};

export type CreateTeamMemberInput = {
  employeeId: Scalars['ID']['input'];
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
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  membership: Membership;
  notes?: Maybe<Array<EmployeeNote>>;
  timeTrackingEnabled: Scalars['Boolean']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
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
  membershipId: Scalars['String']['output'];
  note: Scalars['String']['output'];
  organizationId: Scalars['String']['output'];
  startDate: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type EmployeeAbsenceCategory = {
  __typename?: 'EmployeeAbsenceCategory';
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  isSystem: Scalars['Boolean']['output'];
  name?: Maybe<Scalars['String']['output']>;
  organizationId: Scalars['ID']['output'];
  systemCode?: Maybe<SystemEmployeeAbsenceCategory>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
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
  weeklyHours?: Maybe<Scalars['String']['output']>;
  workloadPercent?: Maybe<Scalars['Float']['output']>;
};

export enum EmployeeContractType {
  Apprenticeship = 'APPRENTICESHIP',
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

export enum EmployeeOnboardingStatus {
  Completed = 'COMPLETED',
  InProgress = 'IN_PROGRESS',
  NotStarted = 'NOT_STARTED'
}

export enum EmployeePaymentInterval {
  MonthlyX12 = 'MONTHLY_X12',
  MonthlyX13 = 'MONTHLY_X13'
}

export enum EmployeeResidencePermitType {
  B = 'B',
  C = 'C',
  Citizen = 'CITIZEN',
  F = 'F',
  G = 'G',
  L = 'L',
  Other = 'OTHER'
}

/** Supported gender types */
export enum Gender {
  Female = 'FEMALE',
  Male = 'MALE',
  Other = 'OTHER'
}

export type GradeLevel = {
  __typename?: 'GradeLevel';
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  sortOrder: Scalars['Int']['output'];
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

export type ImportCurriculumPlanInput = {
  curriculumPosition?: InputMaybe<Scalars['Int']['input']>;
  curriculumSlug: Scalars['String']['input'];
  curriculumTranslations: Array<CurriculumImportPlanTranslationInput>;
  levels: Array<CurriculumImportPlanLevelInput>;
};

export type LessonRecord = {
  __typename?: 'LessonRecord';
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
  recordedAt: Scalars['String']['output'];
  recordedBy?: Maybe<User>;
  recordedById?: Maybe<Scalars['ID']['output']>;
  roomMood?: Maybe<RoomMood>;
  schoolClassEnrollment?: Maybe<SchoolClassEnrollment>;
  schoolClassEnrollmentId?: Maybe<Scalars['ID']['output']>;
  selfAssessment?: Maybe<LessonRecordSelfAssessment>;
  selfAssessmentByChild: Scalars['Boolean']['output'];
  socialForm?: Maybe<LessonRecordSocialForm>;
  status: LessonRecordStatus;
  student?: Maybe<Student>;
  studentId: Scalars['ID']['output'];
  teacherPreparation?: Maybe<TeacherPreparation>;
  teacherStressLevel?: Maybe<TeacherStressLevel>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

/** Schwierigkeitsgrad (ZPD): TOO_EASY / JUST_RIGHT / TOO_HARD. */
export enum LessonRecordDifficulty {
  JustRight = 'JUST_RIGHT',
  TooEasy = 'TOO_EASY',
  TooHard = 'TOO_HARD'
}

/** Beobachtetes Engagement: FOCUSED / INTERESTED / DUTIFUL / RESISTANT. */
export enum LessonRecordEngagement {
  Dutiful = 'DUTIFUL',
  Focused = 'FOCUSED',
  Interested = 'INTERESTED',
  Resistant = 'RESISTANT'
}

export type LessonRecordObservationInput = {
  difficulty?: InputMaybe<LessonRecordDifficulty>;
  engagement?: InputMaybe<LessonRecordEngagement>;
  lessonClarityConfirmed?: InputMaybe<Scalars['Boolean']['input']>;
  roomMood?: InputMaybe<RoomMood>;
  selfAssessment?: InputMaybe<LessonRecordSelfAssessment>;
  selfAssessmentByChild?: InputMaybe<Scalars['Boolean']['input']>;
  socialForm?: InputMaybe<LessonRecordSocialForm>;
  teacherPreparation?: InputMaybe<TeacherPreparation>;
  teacherStressLevel?: InputMaybe<TeacherStressLevel>;
};

/** Selbsteinschätzung des Kindes: UNDERSTOOD / PARTIAL / NEEDS_REPEAT. */
export enum LessonRecordSelfAssessment {
  NeedsRepeat = 'NEEDS_REPEAT',
  Partial = 'PARTIAL',
  Understood = 'UNDERSTOOD'
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

export type Membership = {
  __typename?: 'Membership';
  contactPhone?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  employee?: Maybe<Employee>;
  employeeId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  organization: Organization;
  organizationId: Scalars['ID']['output'];
  persona: Persona;
  roles?: Maybe<Array<Role>>;
  updatedAt: Scalars['DateTime']['output'];
  user?: Maybe<User>;
  userEmail?: Maybe<UserEmail>;
  userEmailId?: Maybe<Scalars['ID']['output']>;
  userId: Scalars['ID']['output'];
  version: Scalars['Int']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addUserEmail: UserEmail;
  archiveAdmissionStage: Scalars['Boolean']['output'];
  archiveContactPerson: Scalars['Boolean']['output'];
  archiveCurriculum: Scalars['Boolean']['output'];
  archiveCurriculumLevel: Scalars['Boolean']['output'];
  archiveCurriculumNode: Scalars['Boolean']['output'];
  createAddress: Address;
  createAdmissionStage: AdmissionStage;
  createContactPerson: ContactPerson;
  createCountry: Country;
  createCurriculum: Curriculum;
  createCurriculumLevel: CurriculumLevel;
  createCurriculumNode: CurriculumNode;
  createEmployee: Employee;
  createEmployeeAbsenceNotice: EmployeeAbsence;
  createEmployeeContract: EmployeeContract;
  createEmployeeNote: EmployeeNote;
  createEnrollment: SchoolClassEnrollment;
  createGradeLevel: GradeLevel;
  createLessonRecord: LessonRecord;
  createLessonRecordsBulk: Array<LessonRecord>;
  createMembership: Membership;
  createOrganization: Organization;
  createOrganizationSetting: OrganizationSettingOutput;
  createSchoolClass: SchoolClass;
  createStudent: Student;
  createStudentNote: StudentNote;
  createTeam: Team;
  createTeamMember: TeamMember;
  createTimeTracking: TimeTracking;
  createUser: User;
  deleteAddress: Scalars['Boolean']['output'];
  deleteCountryInputTemplate: Scalars['Boolean']['output'];
  deleteEmployeeContract: Scalars['Boolean']['output'];
  deleteEnrollment: Scalars['Boolean']['output'];
  deleteGradeLevel: Scalars['Boolean']['output'];
  deleteLessonRecord: Scalars['Boolean']['output'];
  deleteOrganizationSetting: Scalars['Boolean']['output'];
  deleteSchoolClass: Scalars['Boolean']['output'];
  deleteStudent: Scalars['Boolean']['output'];
  deleteTeam: Scalars['Boolean']['output'];
  deleteTeamMember: Scalars['Boolean']['output'];
  deleteTimeTracking: Scalars['Boolean']['output'];
  hardDeleteCurriculum: Scalars['Boolean']['output'];
  importCurriculumFromPlan: Curriculum;
  linkContactPersonToStudent: StudentContactPerson;
  moveStudentToStage: Student;
  removeCountry: Country;
  removeOrganization: Organization;
  removeUser: User;
  removeUserEmail: UserEmail;
  reorderAdmissionStages: Array<AdmissionStage>;
  reorderCurricula: Array<Curriculum>;
  reorderCurriculumLevels: Array<CurriculumLevel>;
  reorderCurriculumNodes: Array<CurriculumNode>;
  reorderGradeLevels: Array<GradeLevel>;
  reorderTeams: Array<Team>;
  seedSystemEmployeeAbsenceCategories: EmployeeAbsenceCategory;
  setLessonPrerequisites: CurriculumNode;
  setPrimaryUserEmail: UserEmail;
  softDeleteEmployeeNote: EmployeeNote;
  softDeleteStudentNote: StudentNote;
  startTimeTracking: TimeTracking;
  stopTimeTracking: TimeTracking;
  transferStudentToSchoolClass?: Maybe<SchoolClassEnrollment>;
  unarchiveCurriculum: Curriculum;
  unarchiveCurriculumNode: Scalars['Boolean']['output'];
  unlinkContactPersonFromStudent: Scalars['Boolean']['output'];
  updateAddress: Address;
  updateAdmissionStage: AdmissionStage;
  updateContactPerson: ContactPerson;
  updateCountry: Country;
  updateCurriculum: Curriculum;
  updateCurriculumLevel: CurriculumLevel;
  updateCurriculumNode: CurriculumNode;
  updateEmployee: Employee;
  updateEmployeeContract: EmployeeContract;
  updateEmployeeNote: EmployeeNote;
  updateEnrollment: SchoolClassEnrollment;
  updateGradeLevel: GradeLevel;
  updateLessonRecord: LessonRecord;
  updateMembership: Membership;
  updateOrganization: Organization;
  updateOrganizationSetting: OrganizationSettingOutput;
  updateRecordKeepingSettings: RecordKeepingSettings;
  updateRolePermissions: Role;
  updateSchoolClass: SchoolClass;
  updateStudent: Student;
  updateStudentContactPersonLink: StudentContactPerson;
  updateStudentNote: StudentNote;
  updateTeam: Team;
  updateTeamMember: TeamMember;
  updateTimeTracking: TimeTracking;
  updateUser: User;
  upsertCountryInputTemplate: CountryInputTemplate;
  upsertCurriculumLevelTranslation: CurriculumLevelTranslation;
  upsertCurriculumNodeTranslation: CurriculumNodeTranslation;
  upsertCurriculumTranslation: CurriculumTranslation;
  upsertEmployeeEmergencyProfile: EmployeeEmergencyProfile;
  upsertEmployeeHrProfile: EmployeeHrProfile;
};


export type MutationAddUserEmailArgs = {
  email: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationArchiveAdmissionStageArgs = {
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


export type MutationCreateAddressArgs = {
  input: CreateAddressInput;
};


export type MutationCreateAdmissionStageArgs = {
  input: CreateAdmissionStageInput;
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


export type MutationCreateEmployeeArgs = {
  createEmployeeInput: CreateEmployeeInput;
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


export type MutationCreateEnrollmentArgs = {
  input: CreateSchoolClassEnrollmentInput;
};


export type MutationCreateGradeLevelArgs = {
  input: CreateGradeLevelInput;
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


export type MutationCreateSchoolClassArgs = {
  input: CreateSchoolClassInput;
};


export type MutationCreateStudentArgs = {
  input: CreateStudentInput;
};


export type MutationCreateStudentNoteArgs = {
  createStudentNoteInput: CreateStudentNoteInput;
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


export type MutationDeleteCountryInputTemplateArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteEmployeeContractArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteEnrollmentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteGradeLevelArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteLessonRecordArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteOrganizationSettingArgs = {
  key: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
};


export type MutationDeleteSchoolClassArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteStudentArgs = {
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


export type MutationHardDeleteCurriculumArgs = {
  id: Scalars['ID']['input'];
};


export type MutationImportCurriculumFromPlanArgs = {
  input: ImportCurriculumPlanInput;
};


export type MutationLinkContactPersonToStudentArgs = {
  input: LinkContactPersonInput;
};


export type MutationMoveStudentToStageArgs = {
  stageId: Scalars['ID']['input'];
  studentId: Scalars['ID']['input'];
};


export type MutationRemoveCountryArgs = {
  id: Scalars['Int']['input'];
};


export type MutationRemoveOrganizationArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveUserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRemoveUserEmailArgs = {
  id: Scalars['ID']['input'];
};


export type MutationReorderAdmissionStagesArgs = {
  input: ReorderAdmissionStagesInput;
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


export type MutationReorderGradeLevelsArgs = {
  input: ReorderGradeLevelsInput;
};


export type MutationReorderTeamsArgs = {
  input: ReorderTeamsInput;
};


export type MutationSeedSystemEmployeeAbsenceCategoriesArgs = {
  orgId: Scalars['String']['input'];
};


export type MutationSetLessonPrerequisitesArgs = {
  input: SetLessonPrerequisitesInput;
};


export type MutationSetPrimaryUserEmailArgs = {
  id: Scalars['ID']['input'];
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


export type MutationUnlinkContactPersonFromStudentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateAddressArgs = {
  input: UpdateAddressInput;
};


export type MutationUpdateAdmissionStageArgs = {
  input: UpdateAdmissionStageInput;
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


export type MutationUpdateEmployeeArgs = {
  updateEmployeeInput: UpdateEmployeeInput;
};


export type MutationUpdateEmployeeContractArgs = {
  input: UpdateEmployeeContractInput;
};


export type MutationUpdateEmployeeNoteArgs = {
  updateEmployeeNoteInput: UpdateEmployeeNoteInput;
};


export type MutationUpdateEnrollmentArgs = {
  input: UpdateSchoolClassEnrollmentInput;
};


export type MutationUpdateGradeLevelArgs = {
  input: UpdateGradeLevelInput;
};


export type MutationUpdateLessonRecordArgs = {
  input: UpdateLessonRecordInput;
};


export type MutationUpdateMembershipArgs = {
  updateMembershipInput: UpdateMembershipInput;
};


export type MutationUpdateOrganizationArgs = {
  updateOrganizationInput: UpdateOrganizationInput;
};


export type MutationUpdateOrganizationSettingArgs = {
  input: UpdateOrganizationSettingInput;
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


export type MutationUpsertEmployeeEmergencyProfileArgs = {
  input: UpsertEmployeeEmergencyProfileInput;
};


export type MutationUpsertEmployeeHrProfileArgs = {
  input: UpsertEmployeeHrProfileInput;
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
  AdmissionStageManage = 'ADMISSION_STAGE_MANAGE',
  AdmissionStageRead = 'ADMISSION_STAGE_READ',
  BillingManage = 'BILLING_MANAGE',
  ContactPersonDelete = 'CONTACT_PERSON_DELETE',
  ContactPersonRead = 'CONTACT_PERSON_READ',
  ContactPersonWrite = 'CONTACT_PERSON_WRITE',
  CurriculumLevelManage = 'CURRICULUM_LEVEL_MANAGE',
  CurriculumLevelRead = 'CURRICULUM_LEVEL_READ',
  CurriculumManage = 'CURRICULUM_MANAGE',
  CurriculumRead = 'CURRICULUM_READ',
  EmployeeRead = 'EMPLOYEE_READ',
  EmployeeWrite = 'EMPLOYEE_WRITE',
  OrgDelete = 'ORG_DELETE',
  OrgTransferOwnership = 'ORG_TRANSFER_OWNERSHIP',
  RecordKeepingRead = 'RECORD_KEEPING_READ',
  RecordKeepingSettingsManage = 'RECORD_KEEPING_SETTINGS_MANAGE',
  RecordKeepingWrite = 'RECORD_KEEPING_WRITE',
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
  UserRemove = 'USER_REMOVE'
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

export type Query = {
  __typename?: 'Query';
  activeEnrollmentsBySchoolClassId: Array<SchoolClassEnrollment>;
  addressById: Address;
  addressesByOrgId: Array<Address>;
  admissionStageById: AdmissionStage;
  admissionStages: Array<AdmissionStage>;
  areaLessonCountsByOrg: Array<AreaLessonCount>;
  areasByOrg: Array<CurriculumNode>;
  authAccountsByUserEmailId: Array<AuthAccount>;
  authContext: AuthContextOutput;
  authUserIdByUserId?: Maybe<Scalars['String']['output']>;
  classroomAttentionSummaries: Array<StudentAttentionSummaryOutput>;
  classroomHeatmapData: ClassroomHeatmapDataOutput;
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
  employeeAbsenceCategoriesByOrgId: Array<EmployeeAbsenceCategory>;
  employeeAuditLog: Array<EmployeeAuditLog>;
  employeeById: Employee;
  employeeContractById: EmployeeContract;
  employeeContractsByEmployeeId: Array<EmployeeContract>;
  employeeContractsByOrgId: Array<EmployeeContract>;
  employeeEmergencyProfile?: Maybe<EmployeeEmergencyProfile>;
  employeeHrProfile?: Maybe<EmployeeHrProfile>;
  employeeNotesByEmployeeId: Array<EmployeeNote>;
  employeesByOrgId: Array<Employee>;
  enrollmentsByStudentId: Array<SchoolClassEnrollment>;
  gradeLevelById: GradeLevel;
  gradeLevelsByOrgId: Array<GradeLevel>;
  isOrganizationDomainAvailable: Scalars['Boolean']['output'];
  isOrganizationSubdomainAvailable: Scalars['Boolean']['output'];
  lessonPrerequisites: Array<CurriculumNode>;
  lessonRecord: LessonRecord;
  lessonRecords: Array<LessonRecord>;
  lessonsByOrg: Array<CurriculumNode>;
  membershipsByOrgId: Array<Membership>;
  myTeachingSchoolClasses: Array<SchoolClass>;
  nextLessonsForStudent: Array<CurriculumNode>;
  organization: Organization;
  organizationSetting: OrganizationSettingOutput;
  organizationSettings: Array<OrganizationSettingOutput>;
  organizations: Array<Organization>;
  permissions: Array<Permission>;
  recordKeepingSettings: RecordKeepingSettings;
  relatedAddressesForContactPerson: Array<AddressSuggestion>;
  rolesByOrgId: Array<Role>;
  rolesByOrganizationId: Array<Role>;
  schoolClassById: SchoolClass;
  schoolClassesByOrgId: Array<SchoolClass>;
  studentById: Student;
  studentNotesByStudentId: Array<StudentNote>;
  studentsByContactPersonId: Array<StudentContactPerson>;
  studentsByOrgId: Array<Student>;
  teachersByOrgId: Array<Employee>;
  teamById: Team;
  teamMemberById: TeamMember;
  teamMembersByOrgId: Array<TeamMember>;
  teamMembersByTeamId: Array<TeamMember>;
  teamsByOrgId: Array<Team>;
  timeTrackingByEmployeeId: Array<TimeTracking>;
  timeTrackingById: TimeTracking;
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


export type QueryClassroomHeatmapDataArgs = {
  locale?: Scalars['String']['input'];
  schoolClassId: Scalars['ID']['input'];
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


export type QueryEmployeeNotesByEmployeeIdArgs = {
  employeeId: Scalars['ID']['input'];
};


export type QueryEnrollmentsByStudentIdArgs = {
  studentId: Scalars['ID']['input'];
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


export type QueryNextLessonsForStudentArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  studentId: Scalars['ID']['input'];
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


export type QueryStudentNotesByStudentIdArgs = {
  studentId: Scalars['ID']['input'];
};


export type QueryStudentsByContactPersonIdArgs = {
  contactPersonId: Scalars['ID']['input'];
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

export type ReorderAdmissionStagesInput = {
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
};

export type ReorderTeamsInput = {
  ids: Array<Scalars['ID']['input']>;
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

export type SchoolClass = {
  __typename?: 'SchoolClass';
  color?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
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

export type SetLessonPrerequisitesInput = {
  lessonId: Scalars['ID']['input'];
  prerequisiteIds: Array<Scalars['ID']['input']>;
};

export type Student = {
  __typename?: 'Student';
  admissionStage?: Maybe<AdmissionStage>;
  admissionStageId?: Maybe<Scalars['ID']['output']>;
  createdAt: Scalars['DateTime']['output'];
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
  team?: Maybe<Team>;
  teamId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type TimeTracking = {
  __typename?: 'TimeTracking';
  breakMinutes?: Maybe<Scalars['Int']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  employee?: Maybe<Employee>;
  employeeId: Scalars['String']['output'];
  endedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  startedAt: Scalars['DateTime']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

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

export type UpdateAdmissionStageInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  position?: InputMaybe<Scalars['Int']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  stageType?: InputMaybe<AdmissionStageType>;
};

export type UpdateContactPersonInput = {
  addressId?: InputMaybe<Scalars['ID']['input']>;
  dateOfBirth?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
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

export type UpdateEmployeeContractInput = {
  annualVacationDays?: InputMaybe<Scalars['Int']['input']>;
  contractType?: InputMaybe<EmployeeContractType>;
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

export type UpdateGradeLevelInput = {
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
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

export type UpdateTeamInput = {
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTeamMemberInput = {
  employeeId?: InputMaybe<Scalars['ID']['input']>;
  id: Scalars['ID']['input'];
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

export type User = {
  __typename?: 'User';
  addressLine2?: Maybe<Scalars['String']['output']>;
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
  lastName: Scalars['String']['output'];
  memberships: Array<Membership>;
  postalCode?: Maybe<Scalars['String']['output']>;
  socialSecurityNumber?: Maybe<Scalars['String']['output']>;
  street?: Maybe<Scalars['String']['output']>;
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

export type AuthUserIdByUserIdQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type AuthUserIdByUserIdQuery = { __typename?: 'Query', authUserIdByUserId?: string | null };

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

export type UpdateContactPersonMutationVariables = Exact<{
  input: UpdateContactPersonInput;
}>;


export type UpdateContactPersonMutation = { __typename?: 'Mutation', updateContactPerson: { __typename?: 'ContactPerson', id: string } };

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


export type EmployeeContractsByEmployeeIdQuery = { __typename?: 'Query', employeeContractsByEmployeeId: Array<{ __typename?: 'EmployeeContract', id: string, employeeId: string, startDate: string, endDate?: string | null, probationEndDate?: string | null, contractType?: EmployeeContractType | null, position?: string | null, supervisorMembershipId?: string | null, workloadPercent?: number | null, weeklyHours?: string | null, grossSalary?: number | null, paymentInterval?: EmployeePaymentInterval | null, has13thSalary?: boolean | null, annualVacationDays?: number | null, remainingVacationDays?: string | null, notes?: string | null, isActive: boolean }> };

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


export type GetEmployeesQuery = { __typename?: 'Query', employeesByOrgId: Array<{ __typename?: 'Employee', membership: { __typename?: 'Membership', persona: Persona, employee?: { __typename?: 'Employee', isActive: boolean, timeTrackingEnabled: boolean, id: string } | null, user?: { __typename?: 'User', firstName: string, id: string, lastName: string, userEmails: Array<{ __typename?: 'UserEmail', email: string, isPrimary: boolean }> } | null } }> };

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

export type CreateGradeLevelMutationVariables = Exact<{
  input: CreateGradeLevelInput;
}>;


export type CreateGradeLevelMutation = { __typename?: 'Mutation', createGradeLevel: { __typename?: 'GradeLevel', id: string, name: string, sortOrder: number } };

export type DeleteGradeLevelMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteGradeLevelMutation = { __typename?: 'Mutation', deleteGradeLevel: boolean };

export type GetGradeLevelsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetGradeLevelsQuery = { __typename?: 'Query', gradeLevelsByOrgId: Array<{ __typename?: 'GradeLevel', id: string, name: string, sortOrder: number }> };

export type ReorderGradeLevelsMutationVariables = Exact<{
  input: ReorderGradeLevelsInput;
}>;


export type ReorderGradeLevelsMutation = { __typename?: 'Mutation', reorderGradeLevels: Array<{ __typename?: 'GradeLevel', id: string, name: string, sortOrder: number }> };

export type UpdateGradeLevelMutationVariables = Exact<{
  input: UpdateGradeLevelInput;
}>;


export type UpdateGradeLevelMutation = { __typename?: 'Mutation', updateGradeLevel: { __typename?: 'GradeLevel', id: string, name: string, sortOrder: number } };

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


export type GetStudentLessonRecordsQuery = { __typename?: 'Query', lessonRecords: Array<{ __typename?: 'LessonRecord', id: string, lessonId: string, recordedAt: string, status: LessonRecordStatus, note?: string | null, lesson?: { __typename?: 'CurriculumNode', id: string, position: number, translations?: Array<{ __typename?: 'CurriculumNodeTranslation', locale: CurriculumLocale, name: string }> | null, ancestors: Array<{ __typename?: 'CurriculumNode', id: string, nodeType: CurriculumNodeType, position: number, translations?: Array<{ __typename?: 'CurriculumNodeTranslation', locale: CurriculumLocale, name: string }> | null }> } | null, recordedBy?: { __typename?: 'User', id: string, firstName: string, lastName: string } | null }> };

export type SetLessonPrerequisitesMutationVariables = Exact<{
  input: SetLessonPrerequisitesInput;
}>;


export type SetLessonPrerequisitesMutation = { __typename?: 'Mutation', setLessonPrerequisites: { __typename?: 'CurriculumNode', id: string } };

export type UpdateLessonRecordMutationVariables = Exact<{
  input: UpdateLessonRecordInput;
}>;


export type UpdateLessonRecordMutation = { __typename?: 'Mutation', updateLessonRecord: { __typename?: 'LessonRecord', id: string, studentId: string, lessonId: string, recordedAt: string, status: LessonRecordStatus, note?: string | null } };

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


export type GetSchoolClassesQuery = { __typename?: 'Query', schoolClassesByOrgId: Array<{ __typename?: 'SchoolClass', id: string, name: string, color?: string | null, description?: string | null, sortOrder: number, maxCapacity?: number | null, room?: string | null, isActive: boolean, gradeLevels?: Array<{ __typename?: 'GradeLevel', id: string, name: string }> | null, teachers?: Array<{ __typename?: 'Employee', id: string, membership: { __typename?: 'Membership', user?: { __typename?: 'User', firstName: string, lastName: string } | null } }> | null }> };

export type GetTeachersByOrgIdQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTeachersByOrgIdQuery = { __typename?: 'Query', teachersByOrgId: Array<{ __typename?: 'Employee', id: string, membership: { __typename?: 'Membership', user?: { __typename?: 'User', id: string, firstName: string, lastName: string } | null } }> };

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


export type GetStudentsQuery = { __typename?: 'Query', studentsByOrgId: Array<{ __typename?: 'Student', id: string, firstName: string, lastName: string, dateOfBirth?: string | null, gender?: Gender | null, enrollmentDate?: string | null, exitDate?: string | null, isActive: boolean }> };

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


export type AddTeamMemberMutation = { __typename?: 'Mutation', createTeamMember: { __typename?: 'TeamMember', id: string } };

export type CreateTeamMutationVariables = Exact<{
  input: CreateTeamInput;
}>;


export type CreateTeamMutation = { __typename?: 'Mutation', createTeam: { __typename?: 'Team', id: string, name: string, sortOrder: number } };

export type DeleteTeamMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteTeamMutation = { __typename?: 'Mutation', deleteTeam: boolean };

export type GetTeamByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetTeamByIdQuery = { __typename?: 'Query', teamById: { __typename?: 'Team', id: string, name: string } };

export type GetTeamMembersQueryVariables = Exact<{
  teamId: Scalars['ID']['input'];
}>;


export type GetTeamMembersQuery = { __typename?: 'Query', teamMembersByTeamId: Array<{ __typename?: 'TeamMember', id: string, employee?: { __typename?: 'Employee', id: string, isActive: boolean, membership: { __typename?: 'Membership', user?: { __typename?: 'User', id: string, firstName: string, lastName: string, userEmails: Array<{ __typename?: 'UserEmail', email: string, isPrimary: boolean }> } | null } } | null }> };

export type GetTeamsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTeamsQuery = { __typename?: 'Query', teamsByOrgId: Array<{ __typename?: 'Team', id: string, name: string, sortOrder: number }> };

export type RemoveTeamMemberMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RemoveTeamMemberMutation = { __typename?: 'Mutation', deleteTeamMember: boolean };

export type ReorderTeamsMutationVariables = Exact<{
  input: ReorderTeamsInput;
}>;


export type ReorderTeamsMutation = { __typename?: 'Mutation', reorderTeams: Array<{ __typename?: 'Team', id: string, name: string, sortOrder: number }> };

export type UpdateTeamMutationVariables = Exact<{
  input: UpdateTeamInput;
}>;


export type UpdateTeamMutation = { __typename?: 'Mutation', updateTeam: { __typename?: 'Team', id: string, name: string } };

export type AddUserEmailMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
  email: Scalars['String']['input'];
}>;


export type AddUserEmailMutation = { __typename?: 'Mutation', addUserEmail: { __typename?: 'UserEmail', id: string, email: string, isPrimary: boolean, isVerified: boolean } };

export type CreateUserMutationVariables = Exact<{
  createUserInput: CreateUserInput;
}>;


export type CreateUserMutation = { __typename?: 'Mutation', createUser: { __typename?: 'User', id: string } };

export type GetAuthContextQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAuthContextQuery = { __typename?: 'Query', authContext: { __typename?: 'AuthContextOutput', roles: Array<string>, permissions: Array<string>, orgId?: string | null, isSuperAdmin: boolean, user: { __typename?: 'User', id: string, firstName: string, lastName: string, userEmails: Array<{ __typename?: 'UserEmail', id: string, email: string, isPrimary: boolean, isVerified: boolean }> } } };

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

export type UpdateUserMutationVariables = Exact<{
  updateUserInput: UpdateUserInput;
}>;


export type UpdateUserMutation = { __typename?: 'Mutation', updateUser: { __typename?: 'User', id: string } };


export const AuthUserIdByUserIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AuthUserIdByUserId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authUserIdByUserId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}]}]}}]} as unknown as DocumentNode<AuthUserIdByUserIdQuery, AuthUserIdByUserIdQueryVariables>;
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
export const UpdateContactPersonDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateContactPerson"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateContactPersonInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateContactPerson"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateContactPersonMutation, UpdateContactPersonMutationVariables>;
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
export const CreateEmployeeAbsenceNoticeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateEmployeeAbsenceNotice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createEmployeeAbsenceInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEmployeeAbsenceNoticeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEmployeeAbsenceNotice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createEmployeeAbsenceInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createEmployeeAbsenceInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateEmployeeAbsenceNoticeMutation, CreateEmployeeAbsenceNoticeMutationVariables>;
export const GetEmployeeAbsenceCategoriesByOrgIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmployeeAbsenceCategoriesByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeeAbsenceCategoriesByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"systemCode"}}]}}]}}]} as unknown as DocumentNode<GetEmployeeAbsenceCategoriesByOrgIdQuery, GetEmployeeAbsenceCategoriesByOrgIdQueryVariables>;
export const CreateEmployeeNoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateEmployeeNote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createEmployeeNoteInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEmployeeNoteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEmployeeNote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createEmployeeNoteInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createEmployeeNoteInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateEmployeeNoteMutation, CreateEmployeeNoteMutationVariables>;
export const GetEmployeeNotesByEmployeeIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmployeeNotesByEmployeeId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeeNotesByEmployeeId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"employeeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"isConfidential"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"authorMembership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetEmployeeNotesByEmployeeIdQuery, GetEmployeeNotesByEmployeeIdQueryVariables>;
export const CreateEmployeeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateEmployee"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createEmployeeInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEmployeeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEmployee"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createEmployeeInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createEmployeeInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateEmployeeMutation, CreateEmployeeMutationVariables>;
export const EmployeeContractsByEmployeeIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EmployeeContractsByEmployeeId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeeContractsByEmployeeId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"employeeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"employeeId"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"probationEndDate"}},{"kind":"Field","name":{"kind":"Name","value":"contractType"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"supervisorMembershipId"}},{"kind":"Field","name":{"kind":"Name","value":"workloadPercent"}},{"kind":"Field","name":{"kind":"Name","value":"weeklyHours"}},{"kind":"Field","name":{"kind":"Name","value":"grossSalary"}},{"kind":"Field","name":{"kind":"Name","value":"paymentInterval"}},{"kind":"Field","name":{"kind":"Name","value":"has13thSalary"}},{"kind":"Field","name":{"kind":"Name","value":"annualVacationDays"}},{"kind":"Field","name":{"kind":"Name","value":"remainingVacationDays"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]} as unknown as DocumentNode<EmployeeContractsByEmployeeIdQuery, EmployeeContractsByEmployeeIdQueryVariables>;
export const CreateEmployeeContractDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateEmployeeContract"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEmployeeContractInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEmployeeContract"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateEmployeeContractMutation, CreateEmployeeContractMutationVariables>;
export const UpdateEmployeeContractDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateEmployeeContract"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateEmployeeContractInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateEmployeeContract"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateEmployeeContractMutation, UpdateEmployeeContractMutationVariables>;
export const DeleteEmployeeContractDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteEmployeeContract"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteEmployeeContract"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteEmployeeContractMutation, DeleteEmployeeContractMutationVariables>;
export const GetEmployeeAuditLogDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmployeeAuditLog"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeeAuditLog"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"employeeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"entityType"}},{"kind":"Field","name":{"kind":"Name","value":"fieldName"}},{"kind":"Field","name":{"kind":"Name","value":"oldValue"}},{"kind":"Field","name":{"kind":"Name","value":"newValue"}},{"kind":"Field","name":{"kind":"Name","value":"actorMembershipId"}},{"kind":"Field","name":{"kind":"Name","value":"actorMembership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetEmployeeAuditLogQuery, GetEmployeeAuditLogQueryVariables>;
export const GetEmployeeByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmployeeById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeeById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"employeeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"timeTrackingEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"persona"}},{"kind":"Field","name":{"kind":"Name","value":"contactPhone"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"dateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"socialSecurityNumber"}},{"kind":"Field","name":{"kind":"Name","value":"street"}},{"kind":"Field","name":{"kind":"Name","value":"houseNumber"}},{"kind":"Field","name":{"kind":"Name","value":"addressLine2"}},{"kind":"Field","name":{"kind":"Name","value":"postalCode"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"userEmails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemCode"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetEmployeeByIdQuery, GetEmployeeByIdQueryVariables>;
export const GetEmployeeEmergencyProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmployeeEmergencyProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeeEmergencyProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"employeeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"employeeId"}},{"kind":"Field","name":{"kind":"Name","value":"contact1Name"}},{"kind":"Field","name":{"kind":"Name","value":"contact1Relationship"}},{"kind":"Field","name":{"kind":"Name","value":"contact1Phone"}},{"kind":"Field","name":{"kind":"Name","value":"contact1Email"}},{"kind":"Field","name":{"kind":"Name","value":"contact2Name"}},{"kind":"Field","name":{"kind":"Name","value":"contact2Relationship"}},{"kind":"Field","name":{"kind":"Name","value":"contact2Phone"}},{"kind":"Field","name":{"kind":"Name","value":"contact2Email"}},{"kind":"Field","name":{"kind":"Name","value":"bloodType"}},{"kind":"Field","name":{"kind":"Name","value":"allergies"}},{"kind":"Field","name":{"kind":"Name","value":"chronicConditions"}},{"kind":"Field","name":{"kind":"Name","value":"emergencyMedications"}},{"kind":"Field","name":{"kind":"Name","value":"primaryDoctorName"}},{"kind":"Field","name":{"kind":"Name","value":"primaryDoctorPhone"}},{"kind":"Field","name":{"kind":"Name","value":"pharmacyName"}}]}}]}}]} as unknown as DocumentNode<GetEmployeeEmergencyProfileQuery, GetEmployeeEmergencyProfileQueryVariables>;
export const GetEmployeeHrProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmployeeHrProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeeHrProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"employeeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"employeeId"}},{"kind":"Field","name":{"kind":"Name","value":"iban"}},{"kind":"Field","name":{"kind":"Name","value":"bankAccountHolder"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"bvgInsuranceNumber"}},{"kind":"Field","name":{"kind":"Name","value":"withholdingTaxCode"}},{"kind":"Field","name":{"kind":"Name","value":"nationality"}},{"kind":"Field","name":{"kind":"Name","value":"residencePermitType"}},{"kind":"Field","name":{"kind":"Name","value":"residencePermitValidUntil"}},{"kind":"Field","name":{"kind":"Name","value":"maritalStatus"}},{"kind":"Field","name":{"kind":"Name","value":"denomination"}},{"kind":"Field","name":{"kind":"Name","value":"numberOfChildren"}},{"kind":"Field","name":{"kind":"Name","value":"onboardingStatus"}},{"kind":"Field","name":{"kind":"Name","value":"ndaSigned"}},{"kind":"Field","name":{"kind":"Name","value":"criminalRecordSubmitted"}}]}}]}}]} as unknown as DocumentNode<GetEmployeeHrProfileQuery, GetEmployeeHrProfileQueryVariables>;
export const GetEmployeesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmployees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeesByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employee"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"timeTrackingEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"userEmails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"persona"}}]}}]}}]}}]} as unknown as DocumentNode<GetEmployeesQuery, GetEmployeesQueryVariables>;
export const UpdateEmployeeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateEmployee"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateEmployeeInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateEmployeeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateEmployee"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateEmployeeInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateEmployeeInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateEmployeeMutation, UpdateEmployeeMutationVariables>;
export const UpsertEmployeeEmergencyProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertEmployeeEmergencyProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpsertEmployeeEmergencyProfileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertEmployeeEmergencyProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpsertEmployeeEmergencyProfileMutation, UpsertEmployeeEmergencyProfileMutationVariables>;
export const UpsertEmployeeHrProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertEmployeeHrProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpsertEmployeeHrProfileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertEmployeeHrProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpsertEmployeeHrProfileMutation, UpsertEmployeeHrProfileMutationVariables>;
export const CreateGradeLevelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateGradeLevel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGradeLevelInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createGradeLevel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]}}]} as unknown as DocumentNode<CreateGradeLevelMutation, CreateGradeLevelMutationVariables>;
export const DeleteGradeLevelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteGradeLevel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteGradeLevel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteGradeLevelMutation, DeleteGradeLevelMutationVariables>;
export const GetGradeLevelsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetGradeLevels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gradeLevelsByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]}}]} as unknown as DocumentNode<GetGradeLevelsQuery, GetGradeLevelsQueryVariables>;
export const ReorderGradeLevelsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReorderGradeLevels"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ReorderGradeLevelsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reorderGradeLevels"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]}}]} as unknown as DocumentNode<ReorderGradeLevelsMutation, ReorderGradeLevelsMutationVariables>;
export const UpdateGradeLevelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateGradeLevel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateGradeLevelInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateGradeLevel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]}}]} as unknown as DocumentNode<UpdateGradeLevelMutation, UpdateGradeLevelMutationVariables>;
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
export const GetRecordKeepingSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRecordKeepingSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recordKeepingSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"introducedStuckDays"}},{"kind":"Field","name":{"kind":"Name","value":"practicedStuckDays"}},{"kind":"Field","name":{"kind":"Name","value":"bigGapDays"}}]}}]}}]} as unknown as DocumentNode<GetRecordKeepingSettingsQuery, GetRecordKeepingSettingsQueryVariables>;
export const UpdateRecordKeepingSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateRecordKeepingSettings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateRecordKeepingSettingsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRecordKeepingSettings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"introducedStuckDays"}},{"kind":"Field","name":{"kind":"Name","value":"practicedStuckDays"}},{"kind":"Field","name":{"kind":"Name","value":"bigGapDays"}}]}}]}}]} as unknown as DocumentNode<UpdateRecordKeepingSettingsMutation, UpdateRecordKeepingSettingsMutationVariables>;
export const CreateLessonRecordsBulkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateLessonRecordsBulk"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateLessonRecordsBulkInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createLessonRecordsBulk"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"lessonId"}},{"kind":"Field","name":{"kind":"Name","value":"recordedAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}}]}}]} as unknown as DocumentNode<CreateLessonRecordsBulkMutation, CreateLessonRecordsBulkMutationVariables>;
export const GetAreaLessonCountsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAreaLessonCounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"areaLessonCountsByOrg"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"areaId"}},{"kind":"Field","name":{"kind":"Name","value":"lessonCount"}},{"kind":"Field","name":{"kind":"Name","value":"curriculumId"}},{"kind":"Field","name":{"kind":"Name","value":"curriculumName"}}]}}]}}]} as unknown as DocumentNode<GetAreaLessonCountsQuery, GetAreaLessonCountsQueryVariables>;
export const ClassroomAttentionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ClassroomAttention"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolClassId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locale"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"classroomAttentionSummaries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolClassId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolClassId"}}},{"kind":"Argument","name":{"kind":"Name","value":"locale"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locale"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"totalSignals"}},{"kind":"Field","name":{"kind":"Name","value":"byReason"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"NEEDS_MORE_CURRENT"}},{"kind":"Field","name":{"kind":"Name","value":"REPEATED_NEEDS_MORE"}},{"kind":"Field","name":{"kind":"Name","value":"STUCK_PRACTICED"}},{"kind":"Field","name":{"kind":"Name","value":"STUCK_INTRODUCED"}},{"kind":"Field","name":{"kind":"Name","value":"BIG_GAP_INTRO_TO_PRACTICED"}}]}},{"kind":"Field","name":{"kind":"Name","value":"topItems"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lessonId"}},{"kind":"Field","name":{"kind":"Name","value":"lessonName"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"severity"}},{"kind":"Field","name":{"kind":"Name","value":"days"}},{"kind":"Field","name":{"kind":"Name","value":"since"}},{"kind":"Field","name":{"kind":"Name","value":"ancestors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nodeType"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<ClassroomAttentionQuery, ClassroomAttentionQueryVariables>;
export const ClassroomHeatmapDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ClassroomHeatmapData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolClassId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locale"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"classroomHeatmapData"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolClassId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolClassId"}}},{"kind":"Argument","name":{"kind":"Name","value":"locale"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locale"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"students"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"areas"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"areaId"}},{"kind":"Field","name":{"kind":"Name","value":"areaName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cells"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"areaId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}}]}}]} as unknown as DocumentNode<ClassroomHeatmapDataQuery, ClassroomHeatmapDataQueryVariables>;
export const GetClassroomStudentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetClassroomStudents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolClassId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeEnrollmentsBySchoolClassId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolClassId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolClassId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"student"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}}]} as unknown as DocumentNode<GetClassroomStudentsQuery, GetClassroomStudentsQueryVariables>;
export const GetLessonPrerequisitesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetLessonPrerequisites"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"lessonId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lessonPrerequisites"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"lessonId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"lessonId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"lessonType"}},{"kind":"Field","name":{"kind":"Name","value":"lessonScale"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetLessonPrerequisitesQuery, GetLessonPrerequisitesQueryVariables>;
export const GetLessonsForRecordKeepingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetLessonsForRecordKeeping"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lessonsByOrg"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"includeArchived"},"value":{"kind":"BooleanValue","value":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"lessonType"}},{"kind":"Field","name":{"kind":"Name","value":"lessonScale"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"ancestors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nodeType"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetLessonsForRecordKeepingQuery, GetLessonsForRecordKeepingQueryVariables>;
export const NextLessonsForStudentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"NextLessonsForStudent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nextLessonsForStudent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"lessonType"}},{"kind":"Field","name":{"kind":"Name","value":"lessonScale"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<NextLessonsForStudentQuery, NextLessonsForStudentQueryVariables>;
export const GetOrgAreasDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrgAreas"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"areasByOrg"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"includeArchived"},"value":{"kind":"BooleanValue","value":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"nodeType"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetOrgAreasQuery, GetOrgAreasQueryVariables>;
export const GetStudentLessonRecordsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetStudentLessonRecords"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"LessonRecordsFilterInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lessonRecords"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"lessonId"}},{"kind":"Field","name":{"kind":"Name","value":"recordedAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"note"}},{"kind":"Field","name":{"kind":"Name","value":"lesson"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"ancestors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nodeType"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"recordedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}}]} as unknown as DocumentNode<GetStudentLessonRecordsQuery, GetStudentLessonRecordsQueryVariables>;
export const SetLessonPrerequisitesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetLessonPrerequisites"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SetLessonPrerequisitesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setLessonPrerequisites"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<SetLessonPrerequisitesMutation, SetLessonPrerequisitesMutationVariables>;
export const UpdateLessonRecordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateLessonRecord"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateLessonRecordInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateLessonRecord"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"lessonId"}},{"kind":"Field","name":{"kind":"Name","value":"recordedAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}}]}}]} as unknown as DocumentNode<UpdateLessonRecordMutation, UpdateLessonRecordMutationVariables>;
export const GetPermissionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPermissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<GetPermissionsQuery, GetPermissionsQueryVariables>;
export const GetRolesByOrgIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRolesByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rolesByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemCode"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetRolesByOrgIdQuery, GetRolesByOrgIdQueryVariables>;
export const UpdateRolePermissionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateRolePermissions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateRolePermissionsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRolePermissions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateRolePermissionsMutation, UpdateRolePermissionsMutationVariables>;
export const CreateSchoolClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateSchoolClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSchoolClassInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSchoolClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateSchoolClassMutation, CreateSchoolClassMutationVariables>;
export const DeleteSchoolClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteSchoolClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteSchoolClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteSchoolClassMutation, DeleteSchoolClassMutationVariables>;
export const GetMyTeachingSchoolClassesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMyTeachingSchoolClasses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myTeachingSchoolClasses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gradeLevels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teachers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"maxCapacity"}},{"kind":"Field","name":{"kind":"Name","value":"room"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]} as unknown as DocumentNode<GetMyTeachingSchoolClassesQuery, GetMyTeachingSchoolClassesQueryVariables>;
export const GetSchoolClassByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSchoolClassById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schoolClassById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gradeLevels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teachers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"maxCapacity"}},{"kind":"Field","name":{"kind":"Name","value":"room"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]} as unknown as DocumentNode<GetSchoolClassByIdQuery, GetSchoolClassByIdQueryVariables>;
export const GetSchoolClassesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSchoolClasses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schoolClassesByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gradeLevels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teachers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"maxCapacity"}},{"kind":"Field","name":{"kind":"Name","value":"room"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]} as unknown as DocumentNode<GetSchoolClassesQuery, GetSchoolClassesQueryVariables>;
export const GetTeachersByOrgIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTeachersByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teachersByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetTeachersByOrgIdQuery, GetTeachersByOrgIdQueryVariables>;
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
export const GetStudentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetStudents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentsByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"dateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"enrollmentDate"}},{"kind":"Field","name":{"kind":"Name","value":"exitDate"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]} as unknown as DocumentNode<GetStudentsQuery, GetStudentsQueryVariables>;
export const UpdateEnrollmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateEnrollment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSchoolClassEnrollmentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateEnrollment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateEnrollmentMutation, UpdateEnrollmentMutationVariables>;
export const UpdateStudentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateStudent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateStudentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateStudent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateStudentMutation, UpdateStudentMutationVariables>;
export const AddTeamMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddTeamMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTeamMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTeamMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AddTeamMemberMutation, AddTeamMemberMutationVariables>;
export const CreateTeamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTeam"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTeamInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTeam"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]}}]} as unknown as DocumentNode<CreateTeamMutation, CreateTeamMutationVariables>;
export const DeleteTeamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTeam"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTeam"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteTeamMutation, DeleteTeamMutationVariables>;
export const GetTeamByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTeamById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GetTeamByIdQuery, GetTeamByIdQueryVariables>;
export const GetTeamMembersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTeamMembers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamMembersByTeamId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"employee"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"userEmails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetTeamMembersQuery, GetTeamMembersQueryVariables>;
export const GetTeamsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTeams"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamsByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]}}]} as unknown as DocumentNode<GetTeamsQuery, GetTeamsQueryVariables>;
export const RemoveTeamMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveTeamMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTeamMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<RemoveTeamMemberMutation, RemoveTeamMemberMutationVariables>;
export const ReorderTeamsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReorderTeams"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ReorderTeamsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reorderTeams"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]}}]} as unknown as DocumentNode<ReorderTeamsMutation, ReorderTeamsMutationVariables>;
export const UpdateTeamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTeam"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTeamInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTeam"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<UpdateTeamMutation, UpdateTeamMutationVariables>;
export const AddUserEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddUserEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addUserEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"isVerified"}}]}}]}}]} as unknown as DocumentNode<AddUserEmailMutation, AddUserEmailMutationVariables>;
export const CreateUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createUserInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createUserInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createUserInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateUserMutation, CreateUserMutationVariables>;
export const GetAuthContextDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAuthContext"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authContext"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"userEmails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"isVerified"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"roles"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"orgId"}},{"kind":"Field","name":{"kind":"Name","value":"isSuperAdmin"}}]}}]}}]} as unknown as DocumentNode<GetAuthContextQuery, GetAuthContextQueryVariables>;
export const RolesByOrganizationIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RolesByOrganizationId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rolesByOrganizationId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemCode"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}}]}}]}}]} as unknown as DocumentNode<RolesByOrganizationIdQuery, RolesByOrganizationIdQueryVariables>;
export const GetUserByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"dateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"isSuperAdmin"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"userEmails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"isVerified"}}]}},{"kind":"Field","name":{"kind":"Name","value":"memberships"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"persona"}},{"kind":"Field","name":{"kind":"Name","value":"contactPhone"}},{"kind":"Field","name":{"kind":"Name","value":"userEmailId"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetUserByIdQuery, GetUserByIdQueryVariables>;
export const GetUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"isSuperAdmin"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"userEmails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"isVerified"}},{"kind":"Field","name":{"kind":"Name","value":"authAccounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"memberships"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"persona"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetUsersQuery, GetUsersQueryVariables>;
export const RemoveUserEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveUserEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeUserEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<RemoveUserEmailMutation, RemoveUserEmailMutationVariables>;
export const SetPrimaryUserEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetPrimaryUserEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setPrimaryUserEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}}]}}]}}]} as unknown as DocumentNode<SetPrimaryUserEmailMutation, SetPrimaryUserEmailMutationVariables>;
export const UpdateUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateUserInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateUserInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateUserInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateUserMutation, UpdateUserMutationVariables>;