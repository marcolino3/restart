import type { RetentionEntityType } from "./schemas/retention-policy-form.schema";

export type PurgeStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "EXECUTED"
  | "FAILED";

export type PurgeAction = "DELETE" | "ANONYMIZE";

export type PurgeCandidate = {
  id: string;
  entityType: RetentionEntityType;
  subjectLabel: string;
  dueSince: string;
  action: PurgeAction;
  status: PurgeStatus;
  reviewedAt?: string | null;
  executedAt?: string | null;
  note?: string | null;
};
