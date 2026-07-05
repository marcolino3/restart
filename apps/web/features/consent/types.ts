import type {
  ConsentLegalBasis,
  ConsentSubjectType,
} from "./schemas/consent-purpose-form.schema";

export type ConsentStatus = "GRANTED" | "DENIED" | "WITHDRAWN";

export type ConsentPurpose = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  appliesTo: ConsentSubjectType[];
  legalBasis: ConsentLegalBasis;
  requiresEvidence: boolean;
  isMandatory: boolean;
  position: number;
  isArchived: boolean;
};

export type Consent = {
  id: string;
  subjectType: ConsentSubjectType;
  subjectId: string;
  purposeId: string;
  status: ConsentStatus;
  grantedByContactPersonId?: string | null;
  decidedAt: string;
  withdrawnAt?: string | null;
  evidenceUrl?: string | null;
  note?: string | null;
  purpose?: Pick<ConsentPurpose, "id" | "name" | "slug"> | null;
};
