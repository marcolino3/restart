import type {
  DataBreachStatus,
  DataBreachRiskLevel,
} from "./schemas/data-breach-form.schema";

export type DataBreachIncident = {
  id: string;
  title: string;
  description: string;
  detectedAt: string;
  status: DataBreachStatus;
  riskLevel: DataBreachRiskLevel;
  affectedScope?: string | null;
  affectedCount?: number | null;
  authorityNotifiedAt?: string | null;
  subjectsNotifiedAt?: string | null;
  measures?: string | null;
  closedAt?: string | null;
  notes?: string | null;
  authorityNotificationDueAt: string;
  assigneeMembership?: {
    id: string;
    user?: { firstName?: string | null; lastName?: string | null } | null;
  } | null;
};
