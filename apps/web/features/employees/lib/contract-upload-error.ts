/**
 * Maps the contract-document upload endpoint's HTTP status to an i18n key.
 *
 * The backend's own `message` is English and sometimes opaque (a storage
 * outage used to surface as a bare "Internal server error"), so it is never
 * shown to the user directly — the status decides the message instead.
 *
 * Keys are namespace-relative to the caller's translations, which is why both
 * the contracts tab ("Employees") and the onboarding wizard
 * ("EmployeeOnboarding") can share this map.
 */
export function contractUploadErrorKey(status: number): string {
  if (status === 413) return "docTooLarge";
  if (status === 400) return "docPdfOnly";
  if (status === 401 || status === 403) return "docForbidden";
  if (status === 503) return "docStorageUnavailable";
  return "docUploadError";
}
