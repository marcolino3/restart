export type ProjectStatus = "ACTIVE" | "ON_HOLD" | "COMPLETED";
export type ProjectMemberRole = "OWNER" | "MEMBER";
export type TaskStatus = "OPEN" | "IN_PROGRESS" | "BLOCKED" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export const TASK_STATUSES: TaskStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "BLOCKED",
  "DONE",
];
export const TASK_PRIORITIES: TaskPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];
export const PROJECT_STATUSES: ProjectStatus[] = [
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
];

export type MembershipRef = {
  id: string;
  userId?: string | null;
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    isSuperAdmin?: boolean | null;
  } | null;
  userEmail?: { email?: string | null } | null;
};

export type ProjectListItem = {
  id: string;
  title: string;
  description?: string | null;
  status: ProjectStatus;
  color?: string | null;
  isArchived: boolean;
  createdAt: string;
};

export type ProjectMember = {
  id: string;
  role: ProjectMemberRole;
  membership?: MembershipRef | null;
};

export type ProjectDetail = ProjectListItem & {
  members: ProjectMember[];
};

export type TaskAssignee = {
  id: string;
  membershipId: string;
  membership?: MembershipRef | null;
};

export type ProjectTemplateTask = {
  id?: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  sortOrder: number;
  dueOffsetDays?: number | null;
};

export type ProjectTemplate = {
  id: string;
  title: string;
  description?: string | null;
  createdAt: string;
  tasks?: ProjectTemplateTask[];
};

export type AgendaGoal = "DECISION" | "INFORMATION" | "DISCUSSION";
export type ProtocolStatus = "DRAFT" | "FINALIZED";

export const AGENDA_GOALS: AgendaGoal[] = [
  "DECISION",
  "INFORMATION",
  "DISCUSSION",
];

export type AgendaItem = {
  no?: number | null;
  topic: string;
  goal?: AgendaGoal | null;
};
export type ProtocolDecisionRow = {
  topic: string;
  decision?: string | null;
  responsible?: string | null;
  dueDate?: string | null;
};
export type ProtocolCommunicationRow = {
  topic: string;
  audience?: string | null;
  responsible?: string | null;
  channel?: string | null;
  dueDate?: string | null;
};
export type ProtocolChallengeRow = {
  topic: string;
  challenge?: string | null;
  supportNeeded?: string | null;
};
export type ProtocolOpenPointRow = {
  topic: string;
  nextStep?: string | null;
  forNextMeeting: boolean;
};

export type ProtocolSections = {
  agendaItems: AgendaItem[];
  decisions: ProtocolDecisionRow[];
  communications: ProtocolCommunicationRow[];
  infoPoints: string[];
  challenges: ProtocolChallengeRow[];
  openPoints: ProtocolOpenPointRow[];
};

export type ProtocolParticipantRef = {
  id: string;
  membershipId: string;
  membership?: MembershipRef | null;
};

export type ProtocolListItem = {
  id: string;
  title: string;
  meetingDate?: string | null;
  status: ProtocolStatus;
  project?: { id: string; title: string } | null;
};

export type Protocol = ProtocolListItem & {
  projectId?: string | null;
  externalParticipants: string[];
  createdByMembershipId?: string | null;
  createdBy?: { userId?: string | null } | null;
  sections: ProtocolSections;
  participants?: ProtocolParticipantRef[];
};

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  sortOrder: number;
  assignees: TaskAssignee[];
  // Present only on the personal "My Tasks" view (cross-project).
  project?: { id: string; title: string; color?: string | null } | null;
  // Set when the task originated from a meeting protocol.
  protocol?: { id: string; title: string } | null;
  // Set when the task was auto-created from an admission reminder — the "source"
  // links back to the application ("Aufnahme: <Kind>").
  admissionApplicationId?: string | null;
  admissionApplication?: {
    id: string;
    childFirstName: string;
    childLastName: string;
  } | null;
};
