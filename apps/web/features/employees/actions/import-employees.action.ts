"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

import { ROUTES } from "@/constants/routes";
import type { ActionResponse } from "@/lib/actions/action-response";
import { readSessionCookieHeader } from "@/lib/graphql/server-cookie-graphql-client";

export interface EmployeeImportResult {
  created: { email: string; warnings?: string[] }[];
  /** Employees that already existed in the org; filled cells overwrote. */
  updated: { email: string; warnings?: string[] }[];
  failed: { email: string; reason: string }[];
}

const backendUrl = () => process.env.BACKEND_URL || "http://localhost:4001";

const readErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    const message = Array.isArray(body.message)
      ? body.message.join(", ")
      : body.message;
    if (message) return message;
  } catch {
    // Not JSON — fall through to the status text.
  }
  return `${response.status} ${response.statusText}`;
};

/**
 * Forwards the CSV/Excel upload to the REST endpoint with the session cookies
 * and invalidates the employees list, so the page shows the imported rows on
 * the next `router.refresh()` without a full reload.
 */
export const importEmployeesAction = async (
  formData: FormData,
): Promise<ActionResponse<EmployeeImportResult>> => {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "File is required" };
  }

  try {
    const body = new FormData();
    body.append("file", file, file.name);
    const response = await fetch(`${backendUrl()}/api/employees/upload`, {
      method: "POST",
      body,
      headers: { cookie: await readSessionCookieHeader() },
      cache: "no-store",
    });
    if (!response.ok) {
      return { success: false, error: await readErrorMessage(response) };
    }
    const data = (await response.json()) as EmployeeImportResult;

    const locale = await getLocale();
    revalidatePath(ROUTES.admin.employees(locale));
    return { success: true, data };
  } catch (error) {
    console.error("Employee import failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
