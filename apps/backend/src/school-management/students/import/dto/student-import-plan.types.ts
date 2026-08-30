import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Gender } from '@/database/enums/gender.enum';
import { RelationshipType } from '../../../contact-persons/enums/relationship-type.enum';
import { Salutation } from '../../../contact-persons/enums/salutation.enum';

export enum StudentImportIssueSeverity {
  ERROR = 'ERROR',
  WARNING = 'WARNING',
}
registerEnumType(StudentImportIssueSeverity, {
  name: 'StudentImportIssueSeverity',
});

/** Machine-readable issue codes; the frontend maps them to i18n messages. */
export enum StudentImportIssueCode {
  MISSING_FIRST_NAME = 'MISSING_FIRST_NAME',
  MISSING_LAST_NAME = 'MISSING_LAST_NAME',
  INVALID_DATE = 'INVALID_DATE',
  INVALID_GENDER = 'INVALID_GENDER',
  INVALID_SALUTATION = 'INVALID_SALUTATION',
  INVALID_RELATIONSHIP = 'INVALID_RELATIONSHIP',
  INVALID_BOOLEAN = 'INVALID_BOOLEAN',
  INVALID_NUMBER = 'INVALID_NUMBER',
  INVALID_EMAIL = 'INVALID_EMAIL',
  CONTACT_MISSING_NAME = 'CONTACT_MISSING_NAME',
  CONTACT_MISSING_RELATIONSHIP = 'CONTACT_MISSING_RELATIONSHIP',
  UNKNOWN_SCHOOL_CLASS = 'UNKNOWN_SCHOOL_CLASS',
  UNKNOWN_GRADE_LEVEL = 'UNKNOWN_GRADE_LEVEL',
  UNKNOWN_COUNTRY = 'UNKNOWN_COUNTRY',
  DUPLICATE_STUDENT_IN_FILE = 'DUPLICATE_STUDENT_IN_FILE',
  POSSIBLE_DUPLICATE_CONTACT = 'POSSIBLE_DUPLICATE_CONTACT',
  CONTACT_DATA_CONFLICT = 'CONTACT_DATA_CONFLICT',
  FAMILY_ADDRESS_CONFLICT = 'FAMILY_ADDRESS_CONFLICT',
  UNKNOWN_COLUMN = 'UNKNOWN_COLUMN',
}
registerEnumType(StudentImportIssueCode, { name: 'StudentImportIssueCode' });

export enum StudentImportMode {
  SKIP_EXISTING = 'SKIP_EXISTING',
  UPDATE_EXISTING = 'UPDATE_EXISTING',
}
registerEnumType(StudentImportMode, { name: 'StudentImportMode' });

@ObjectType('StudentImportIssue')
export class StudentImportIssueType {
  @Field(() => StudentImportIssueSeverity)
  severity: StudentImportIssueSeverity;

  @Field(() => StudentImportIssueCode)
  code: StudentImportIssueCode;

  @Field(() => Int, { nullable: true })
  rowNumber?: number | null;

  @Field(() => String, { nullable: true })
  column?: string | null;

  /** Offending value or extra context (e.g. the unknown class name). */
  @Field(() => String, { nullable: true })
  value?: string | null;

  /** Other rows involved (duplicates, conflicts). */
  @Field(() => [Int], { nullable: true })
  relatedRowNumbers?: number[] | null;
}

@ObjectType('StudentImportPlanAddress')
export class StudentImportPlanAddressType {
  @Field(() => String, { nullable: true })
  street?: string | null;

  @Field(() => String, { nullable: true })
  houseNumber?: string | null;

  @Field(() => String, { nullable: true })
  postalCode?: string | null;

  @Field(() => String, { nullable: true })
  city?: string | null;

  @Field(() => String, { nullable: true })
  countryId?: string | null;

  @Field(() => String, { nullable: true })
  countryName?: string | null;
}

@ObjectType('StudentImportPlanFamily')
export class StudentImportPlanFamilyType {
  @Field(() => String)
  key: string;

  @Field(() => String)
  name: string;

  @Field(() => StudentImportPlanAddressType, { nullable: true })
  address?: StudentImportPlanAddressType | null;

  /** Existing family reused when a matched contact already belongs to one. */
  @Field(() => String, { nullable: true })
  existingFamilyId?: string | null;
}

@ObjectType('StudentImportPlanContact')
export class StudentImportPlanContactType {
  @Field(() => String)
  tempId: string;

  @Field(() => String)
  familyKey: string;

  @Field(() => String, { nullable: true })
  existingContactPersonId?: string | null;

  @Field(() => Salutation, { nullable: true })
  salutation?: Salutation | null;

  @Field(() => String, { nullable: true })
  title?: string | null;

  @Field(() => String)
  firstName: string;

  @Field(() => String)
  lastName: string;

  @Field(() => String, { nullable: true })
  email?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field(() => String, { nullable: true })
  mobile?: string | null;

  @Field(() => String, { nullable: true })
  occupation?: string | null;

  @Field(() => [String])
  preferredLanguages: string[];

  @Field(() => [RelationshipType])
  roles: RelationshipType[];

  @Field(() => [Int])
  sourceRowNumbers: number[];
}

@ObjectType('StudentImportPlanLink')
export class StudentImportPlanLinkType {
  @Field(() => String)
  contactTempId: string;

  @Field(() => RelationshipType)
  relationshipType: RelationshipType;

  @Field(() => Boolean)
  isPrimaryContact: boolean;

  @Field(() => Boolean)
  hasCustody: boolean;

  @Field(() => Boolean)
  isPickupAuthorized: boolean;

  @Field(() => Int, { nullable: true })
  emergencyPriority?: number | null;

  @Field(() => Boolean)
  livesWithStudent: boolean;
}

@ObjectType('StudentImportPlanStudent')
export class StudentImportPlanStudentType {
  @Field(() => String)
  tempId: string;

  @Field(() => Int)
  sourceRowNumber: number;

  @Field(() => String)
  familyKey: string;

  @Field(() => String, { nullable: true })
  existingStudentId?: string | null;

  @Field(() => String)
  firstName: string;

  @Field(() => String)
  lastName: string;

  @Field(() => String, { nullable: true })
  preferredName?: string | null;

  @Field(() => String, { nullable: true })
  dateOfBirth?: string | null;

  @Field(() => Gender, { nullable: true })
  gender?: Gender | null;

  @Field(() => String, { nullable: true })
  placeOfBirth?: string | null;

  @Field(() => [String])
  nationalities: string[];

  @Field(() => [String])
  firstLanguages: string[];

  @Field(() => [String])
  familyLanguages: string[];

  @Field(() => String, { nullable: true })
  religion?: string | null;

  @Field(() => String, { nullable: true })
  socialSecurityNumber?: string | null;

  @Field(() => String, { nullable: true })
  externalStudentId?: string | null;

  @Field(() => String, { nullable: true })
  enrollmentDate?: string | null;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field(() => String, { nullable: true })
  schoolClassId?: string | null;

  @Field(() => String, { nullable: true })
  schoolClassName?: string | null;

  @Field(() => String, { nullable: true })
  gradeLevelId?: string | null;

  @Field(() => String, { nullable: true })
  gradeLevelName?: string | null;

  @Field(() => [StudentImportPlanLinkType])
  links: StudentImportPlanLinkType[];
}

@ObjectType('StudentImportPlanStats')
export class StudentImportPlanStatsType {
  @Field(() => Int)
  rowCount: number;

  @Field(() => Int)
  newStudentCount: number;

  @Field(() => Int)
  existingStudentCount: number;

  @Field(() => Int)
  newContactCount: number;

  @Field(() => Int)
  existingContactCount: number;

  /** Contacts that appear on more than one row and were merged (siblings). */
  @Field(() => Int)
  mergedContactCount: number;

  @Field(() => Int)
  familyCount: number;

  @Field(() => Int)
  errorCount: number;

  @Field(() => Int)
  warningCount: number;
}

@ObjectType('StudentImportPlan')
export class StudentImportPlanType {
  @Field(() => [StudentImportPlanStudentType])
  students: StudentImportPlanStudentType[];

  @Field(() => [StudentImportPlanContactType])
  contacts: StudentImportPlanContactType[];

  @Field(() => [StudentImportPlanFamilyType])
  families: StudentImportPlanFamilyType[];

  @Field(() => [StudentImportIssueType])
  issues: StudentImportIssueType[];

  @Field(() => StudentImportPlanStatsType)
  stats: StudentImportPlanStatsType;
}

@ObjectType('StudentImportResult')
export class StudentImportResultType {
  @Field(() => Int)
  createdStudents: number;

  @Field(() => Int)
  updatedStudents: number;

  @Field(() => Int)
  skippedStudents: number;

  @Field(() => Int)
  createdContacts: number;

  @Field(() => Int)
  updatedContacts: number;

  @Field(() => Int)
  createdFamilies: number;

  @Field(() => Int)
  createdLinks: number;

  @Field(() => Int)
  createdEnrollments: number;
}
