import type { RadioCardOption } from "@/components/form/form-fields/RadioCardFormField";

/** Minimal role shape the onboarding wizard needs to render its radio cards. */
export type RoleOptionSource = {
  id: string;
  name: string | null;
  systemCode: string | null;
};

/**
 * Subset of next-intl's translator used here: `has` guards the lookup so
 * untranslated custom roles fall back to their own name instead of throwing.
 */
export type RoleTranslator = {
  has: (key: string) => boolean;
  (key: string): string;
};

/**
 * Maps org roles to wizard radio cards.
 *
 * System roles carry their code as name in the DB, so they prefer the
 * translated label/description; custom roles use their own name and fall back
 * to the raw code (then the id) when neither is set.
 */
export function buildRoleOptions(
  roles: RoleOptionSource[],
  t: RoleTranslator,
): RadioCardOption[] {
  return roles.map((r) => {
    const nameKey = `roleName_${r.systemCode}`;
    const descKey = `roleDesc_${r.systemCode}`;

    return {
      value: r.id,
      label:
        r.systemCode && t.has(nameKey)
          ? t(nameKey)
          : (r.name ?? r.systemCode ?? r.id),
      description: r.systemCode && t.has(descKey) ? t(descKey) : undefined,
    };
  });
}
