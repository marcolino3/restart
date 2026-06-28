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
};
