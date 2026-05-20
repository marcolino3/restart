"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";
import type { AbsenceCategoryItem } from "../types";

const Document = gql`
  mutation UpdateEmployeeAbsenceCategory(
    $input: UpdateEmployeeAbsenceCategoryInput!
  ) {
    updateEmployeeAbsenceCategory(input: $input) {
      id
    }
  }
`;

type UpdateInput = {
  id: string;
  translations?: Array<{
    locale: "DE" | "FR" | "IT" | "EN";
    name: string;
    description?: string | null;
  }>;
  countsAsWorkTime?: boolean;
  isPaid?: boolean;
  affectsVacationBalance?: boolean;
  defaultIsVacationCapable?: boolean;
  reducesVacationEntitlementAfterDays?: number | null;
  requiresCertificate?: boolean;
  certificateRequiredFromDay?: number | null;
  maxDaysPerYear?: number | null;
  defaultPercentage?: number;
  requiresApproval?: boolean;
  color?: string | null;
  iconName?: string | null;
  sortOrder?: number;
};

type Response = {
  updateEmployeeAbsenceCategory: Pick<AbsenceCategoryItem, "id">;
};

export const updateEmployeeAbsenceCategoryAction = async (
  input: UpdateInput,
) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { updateEmployeeAbsenceCategory } = await client.request<Response>(
      Document,
      { input: sanitize(input) },
    );
    revalidatePath(`/${locale}/admin/absence-categories`);
    revalidatePath(`/${locale}/admin/absence-categories/edit/${input.id}`);
    return { success: true as const, data: updateEmployeeAbsenceCategory };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};

function sanitize(input: UpdateInput) {
  const out: Record<string, unknown> = { id: input.id };
  if (input.translations) {
    out.translations = input.translations
      .filter((t) => t.name.trim().length > 0)
      .map((t) => ({
        locale: t.locale,
        name: t.name.trim(),
        ...(t.description?.trim() ? { description: t.description.trim() } : {}),
      }));
  }
  const directKeys: Array<keyof UpdateInput> = [
    "countsAsWorkTime",
    "isPaid",
    "affectsVacationBalance",
    "defaultIsVacationCapable",
    "requiresCertificate",
    "requiresApproval",
    "defaultPercentage",
    "sortOrder",
  ];
  for (const k of directKeys) {
    if (input[k] !== undefined) out[k] = input[k];
  }
  const nullableNumberKeys: Array<keyof UpdateInput> = [
    "reducesVacationEntitlementAfterDays",
    "certificateRequiredFromDay",
    "maxDaysPerYear",
  ];
  for (const k of nullableNumberKeys) {
    const v = input[k];
    if (v === undefined) continue;
    out[k] = v ?? null;
  }
  const nullableStringKeys: Array<keyof UpdateInput> = ["color", "iconName"];
  for (const k of nullableStringKeys) {
    const v = input[k];
    if (v === undefined) continue;
    out[k] = v && String(v).trim().length > 0 ? v : null;
  }
  return out;
}
