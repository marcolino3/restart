/**
 * Maps an admin route to its `SiteHeader` translation key.
 *
 * Kept as a pure function (separate from the component) so the mapping can be
 * unit-tested without rendering: every route under `app/[locale]/(protected)/
 * admin/` must resolve to its own title instead of silently falling back to
 * "dashboard".
 */

/**
 * Route prefix -> `SiteHeader` message key.
 *
 * Order does not matter: `resolveRouteTitleKey` picks the LONGEST matching
 * prefix, so nested routes (`/admin/settings/country-templates`) win over
 * their parent (`/admin/settings`).
 */
const ROUTE_TITLE_MAP: Record<string, string> = {
  "/admin/absence-categories": "absenceCategories",
  "/admin/admissions": "admissions",
  "/admin/chats": "chats",
  "/admin/contact-persons": "contactPersons",
  "/admin/curricula": "curricula",
  "/admin/data-protection": "dataProtection",
  "/admin/employees": "employees",
  "/admin/grade-levels": "gradeLevels",
  "/admin/my-tasks": "myTasks",
  "/admin/my-time-tracking": "timeTracking",
  "/admin/organizations": "organizations",
  "/admin/projects/templates": "projectTemplates",
  "/admin/projects": "projects",
  "/admin/protocols": "protocols",
  "/admin/record-keeping": "recordKeeping",
  "/admin/roles": "roles",
  "/admin/school-classes": "schoolClasses",
  "/admin/settings/country-templates": "countryTemplates",
  "/admin/settings": "settings",
  "/admin/students": "students",
  "/admin/teams": "teams",
  "/admin/time-tracking-report": "timeTrackingReport",
  "/admin/time-tracking-settings": "timeTrackingSettings",
  "/admin/users": "users",
};

export const DEFAULT_ROUTE_TITLE_KEY = "dashboard";

/** Strips a leading locale segment: `/de/admin/students` -> `/admin/students`. */
export function stripLocalePrefix(pathname: string): string {
  return pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "");
}

/**
 * Resolves the `SiteHeader` translation key for a pathname (with or without a
 * locale prefix). Falls back to the dashboard key for unmapped routes.
 */
export function resolveRouteTitleKey(pathname: string): string {
  const path = stripLocalePrefix(pathname);

  let bestKey = DEFAULT_ROUTE_TITLE_KEY;
  let bestLength = 0;

  for (const [route, key] of Object.entries(ROUTE_TITLE_MAP)) {
    // Guard against `/admin/user` matching the `/admin/users` prefix: the
    // match must end at a segment boundary.
    const isSegmentMatch =
      path === route || path.startsWith(`${route}/`);

    if (isSegmentMatch && route.length > bestLength) {
      bestKey = key;
      bestLength = route.length;
    }
  }

  return bestKey;
}

export { ROUTE_TITLE_MAP };
