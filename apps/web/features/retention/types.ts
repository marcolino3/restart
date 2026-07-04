import type {
  RetentionEntityType,
  RetentionAction,
} from "./schemas/retention-policy-form.schema";

export type RetentionPolicy = {
  id: string;
  entityType: RetentionEntityType;
  retentionMonths: number;
  action: RetentionAction;
  description?: string | null;
  isEnabled: boolean;
  /** Read-only preview; null for entity types without a wired anchor. */
  dueCount?: number | null;
};
