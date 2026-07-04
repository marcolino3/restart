import type {
  DataSubjectRequestType,
  DataSubjectRequestStatus,
  DataSubjectType,
} from "./schemas/data-request-form.schema";

export type DataSubjectRequest = {
  id: string;
  type: DataSubjectRequestType;
  status: DataSubjectRequestStatus;
  subjectType: DataSubjectType;
  subjectId?: string | null;
  subjectName: string;
  contactEmail?: string | null;
  receivedAt: string;
  dueDate: string;
  resolvedAt?: string | null;
  resolutionNote?: string | null;
  notes?: string | null;
  assigneeMembershipId?: string | null;
  assigneeMembership?: {
    id: string;
    user?: { firstName?: string | null; lastName?: string | null } | null;
  } | null;
};
