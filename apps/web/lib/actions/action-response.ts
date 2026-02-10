export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: unknown };
