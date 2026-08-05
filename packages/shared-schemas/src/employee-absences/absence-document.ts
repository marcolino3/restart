import z from "zod";

/** Relative URL of a file uploaded via the absence-certificates API. */
export const ABSENCE_DOCUMENT_URL_RE =
  /^\/api\/absence-certificates\/[a-zA-Z0-9.-]+$/;

/** Uploaded absence file with a user-defined label (certificate or supplementary doc). */
export const AbsenceDocumentSchema = z.object({
  url: z
    .string()
    .min(1)
    .regex(
      ABSENCE_DOCUMENT_URL_RE,
      "Document must be an uploaded absence certificate",
    ),
  label: z.string().max(200).default(""),
});

export type AbsenceDocument = z.infer<typeof AbsenceDocumentSchema>;

export function isAbsenceDocumentUrl(url: string): boolean {
  return ABSENCE_DOCUMENT_URL_RE.test(url);
}

/** Append employeeId for authenticated certificate download/delete. */
export function absenceDocumentAccessUrl(
  url: string,
  employeeId: string,
): string {
  if (!employeeId || !url.startsWith("/api/absence-certificates/")) {
    return url;
  }
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}employeeId=${encodeURIComponent(employeeId)}`;
}

/** Normalize API / legacy values to labeled documents. */
export function normalizeAbsenceDocuments(value: unknown): AbsenceDocument[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (typeof entry === "string" && entry.trim()) {
        return { url: entry.trim(), label: "" };
      }
      if (entry && typeof entry === "object" && "url" in entry) {
        const url = String((entry as { url: unknown }).url ?? "").trim();
        if (!url) return null;
        const label = String((entry as { label?: unknown }).label ?? "").trim();
        return { url, label };
      }
      return null;
    })
    .filter((entry): entry is AbsenceDocument => entry !== null);
}
