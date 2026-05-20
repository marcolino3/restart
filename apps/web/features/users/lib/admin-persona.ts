export type Persona =
  | "ADMIN"
  | "HR"
  | "OFFICE"
  | "TEACHER"
  | "PARENT"
  | "STUDENT"
  | "EMPLOYEE";

export const ADMIN_PERSONAS: ReadonlySet<Persona> = new Set([
  "ADMIN",
  "HR",
  "OFFICE",
]);

export function isAdminPersona(
  persona: Persona | null | undefined,
): boolean {
  return !!persona && ADMIN_PERSONAS.has(persona);
}
