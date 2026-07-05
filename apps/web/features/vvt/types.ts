import type { VvtLegalBasis } from "./schemas/vvt-form.schema";

export type ProcessingActivity = {
  id: string;
  name: string;
  purpose?: string | null;
  legalBasis: VvtLegalBasis;
  dataCategories?: string | null;
  dataSubjects?: string | null;
  recipients?: string | null;
  retentionNote?: string | null;
};

export type Subprocessor = {
  id: string;
  name: string;
  purpose?: string | null;
  country?: string | null;
  dpaSigned: boolean;
  url?: string | null;
  notes?: string | null;
};
