/**
 * Mirrors the backend student import plan (`students/import/dto`). The preview
 * comes back from the REST endpoint, the commit goes out via GraphQL, so both
 * shapes are declared here instead of relying on codegen for the upload leg.
 */

export type StudentImportIssueSeverity = "ERROR" | "WARNING";

export type StudentImportIssueCode =
  | "MISSING_FIRST_NAME"
  | "MISSING_LAST_NAME"
  | "INVALID_DATE"
  | "INVALID_GENDER"
  | "INVALID_SALUTATION"
  | "INVALID_RELATIONSHIP"
  | "INVALID_BOOLEAN"
  | "INVALID_NUMBER"
  | "INVALID_EMAIL"
  | "CONTACT_MISSING_NAME"
  | "CONTACT_MISSING_RELATIONSHIP"
  | "UNKNOWN_SCHOOL_CLASS"
  | "UNKNOWN_GRADE_LEVEL"
  | "UNKNOWN_COUNTRY"
  | "DUPLICATE_STUDENT_IN_FILE"
  | "POSSIBLE_DUPLICATE_CONTACT"
  | "CONTACT_DATA_CONFLICT"
  | "FAMILY_ADDRESS_CONFLICT"
  | "UNKNOWN_COLUMN";

export type StudentImportMode = "SKIP_EXISTING" | "UPDATE_EXISTING";

export type StudentImportIssue = {
  severity: StudentImportIssueSeverity;
  code: StudentImportIssueCode;
  rowNumber?: number | null;
  column?: string | null;
  value?: string | null;
  relatedRowNumbers?: number[] | null;
};

export type StudentImportAddress = {
  street?: string | null;
  houseNumber?: string | null;
  postalCode?: string | null;
  city?: string | null;
  countryId?: string | null;
  countryName?: string | null;
};

export type StudentImportFamily = {
  key: string;
  name: string;
  address?: StudentImportAddress | null;
  existingFamilyId?: string | null;
};

export type StudentImportContact = {
  tempId: string;
  familyKey: string;
  existingContactPersonId?: string | null;
  salutation?: string | null;
  title?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  occupation?: string | null;
  preferredLanguages: string[];
  roles: string[];
  sourceRowNumbers: number[];
};

export type StudentImportLink = {
  contactTempId: string;
  relationshipType: string;
  isPrimaryContact: boolean;
  hasCustody: boolean;
  isPickupAuthorized: boolean;
  emergencyPriority?: number | null;
  livesWithStudent: boolean;
};

export type StudentImportStudent = {
  tempId: string;
  sourceRowNumber: number;
  familyKey: string;
  existingStudentId?: string | null;
  firstName: string;
  lastName: string;
  preferredName?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  placeOfBirth?: string | null;
  nationalities: string[];
  firstLanguages: string[];
  familyLanguages: string[];
  religion?: string | null;
  socialSecurityNumber?: string | null;
  externalStudentId?: string | null;
  enrollmentDate?: string | null;
  notes?: string | null;
  schoolClassId?: string | null;
  schoolClassName?: string | null;
  gradeLevelId?: string | null;
  gradeLevelName?: string | null;
  links: StudentImportLink[];
};

export type StudentImportStats = {
  rowCount: number;
  newStudentCount: number;
  existingStudentCount: number;
  newContactCount: number;
  existingContactCount: number;
  mergedContactCount: number;
  familyCount: number;
  errorCount: number;
  warningCount: number;
};

export type StudentImportPlan = {
  students: StudentImportStudent[];
  contacts: StudentImportContact[];
  families: StudentImportFamily[];
  issues: StudentImportIssue[];
  stats: StudentImportStats;
};

export type StudentImportResult = {
  createdStudents: number;
  updatedStudents: number;
  skippedStudents: number;
  createdContacts: number;
  updatedContacts: number;
  createdFamilies: number;
  createdLinks: number;
  createdEnrollments: number;
};
