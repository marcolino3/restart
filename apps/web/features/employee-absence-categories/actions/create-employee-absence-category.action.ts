"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";
import type { AbsenceCategoryItem } from "../types";

const Document = gql`
  mutation CreateEmployeeAbsenceCategory(
    $input: CreateEmployeeAbsenceCategoryInput!
  ) {
    createEmployeeAbsenceCategory(input: $input) {
      id
    }
  }
`;

type CreateInput = {
  translations: Array<{
    locale: "DE" | "FR" | "IT" | "EN";
    name: string;
    description?: string | null;
  }>;
  countsAsWorkTime: boolean;
  isPaid: boolean;
  affectsVacationBalance: boolean;
  defaultIsVacationCapable: boolean;
  reducesVacationEntitlementAfterDays?: number | null;
  requiresCertificate: boolean;
  certificateRequiredFromDay?: number | null;
  maxDaysPerYear?: number | null;
  defaultPercentage: number;
  requiresApproval: boolean;
  color?: string | null;
  iconName?: string | null;
  sortOrder: number;
};

type Response = {
  createEmployeeAbsenceCategory: Pick<AbsenceCategoryItem, "id">;
};

export const createEmployeeAbsenceCategoryAction = async (
  input: CreateInput,
) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { createEmployeeAbsenceCategory } = await client.request<Response>(
      Document,
      { input: sanitize(input) },
    );
    revalidatePath(`/${locale}/admin/absence-categories`);
    return { success: true as const, data: createEmployeeAbsenceCategory };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};

function sanitize(input: CreateInput) {
  const {
    reducesVacationEntitlementAfterDays,
    certificateRequiredFromDay,
    maxDaysPerYear,
    color,
    iconName,
    translations,
    ...rest
  } = input;
  return {
    ...rest,
    translations: translations
      .filter((t) => t.name.trim().length > 0)
      .map((t) => ({
        locale: t.locale,
        name: t.name.trim(),
        ...(t.description?.trim() ? { description: t.description.trim() } : {}),
      })),
    ...(reducesVacationEntitlementAfterDays
      ? { reducesVacationEntitlementAfterDays }
      : {}),
    ...(certificateRequiredFromDay ? { certificateRequiredFromDay } : {}),
    ...(maxDaysPerYear ? { maxDaysPerYear } : {}),
    ...(color ? { color } : {}),
    ...(iconName ? { iconName } : {}),
  };
}
