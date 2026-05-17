export type KanbanStudent = {
  id: string;
  firstName: string;
  lastName: string;
};

export type KanbanClassroom = {
  id: string;
  name: string;
  color?: string | null;
  maxCapacity?: number | null;
  sortOrder: number;
  gradeLevelIds: string[];
  studentIds: string[];
};

/** Special column ID for the "unassigned" lane. */
export const UNASSIGNED_COLUMN_ID = "__unassigned__";
