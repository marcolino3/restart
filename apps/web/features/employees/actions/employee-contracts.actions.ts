"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import {
  EmployeeContractFormSchema,
  EmployeeContractFormOutput,
  buildEmployeeContractFormSchema,
  clearHiddenContractFormFields,
} from "../schemas/employee-contract-form.schema";
import type { WeekdayTimeWindows } from "@restart/shared-schemas/employees/employee-onboarding-form.schema";
import type { z } from "zod";
import type { EmployeeContractTypeEnum } from "@restart/shared-schemas/employees/employee-contract-form.schema";
import type { ContractTypeDependentField } from "@restart/shared-schemas/employees/contract-type-rules";

export type EmployeeContractType = z.infer<typeof EmployeeContractTypeEnum>;

export type EmployeePaymentInterval = "MONTHLY_X12" | "MONTHLY_X13";

export type EmployeeContract = {
  id: string;
  employeeId: string;
  startDate: string;
  endDate?: string | null;
  probationEndDate?: string | null;
  contractType?: EmployeeContractType | null;
  position?: string | null;
  supervisorMembershipId?: string | null;
  workloadPercent?: number | null;
  weeklyHours?: string | null;
  grossSalary?: number | null;
  hourlyRate?: number | null;
  paymentInterval?: EmployeePaymentInterval | null;
  has13thSalary?: boolean | null;
  annualVacationDays?: number | null;
  remainingVacationDays?: string | null;
  notes?: string | null;
  documentUrl?: string | null;
  isActive: boolean;
  weekdayTimeWindows?: WeekdayTimeWindows | null;
  weekdayWorkloads?: Partial<
    Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", number | null>
  > | null;
};

const ListByEmployeeDocument = gql`
  query EmployeeContractsByEmployeeId($employeeId: ID!) {
    employeeContractsByEmployeeId(employeeId: $employeeId) {
      id
      employeeId
      startDate
      endDate
      probationEndDate
      contractType
      position
      supervisorMembershipId
      workloadPercent
      weeklyHours
      grossSalary
      hourlyRate
      paymentInterval
      has13thSalary
      annualVacationDays
      remainingVacationDays
      notes
      documentUrl
      isActive
      weekdayWorkloads {
        mon
        tue
        wed
        thu
        fri
        sat
        sun
      }
      weekdayTimeWindows {
        mon { start end }
        tue { start end }
        wed { start end }
        thu { start end }
        fri { start end }
        sat { start end }
        sun { start end }
      }
    }
  }
`;

export const getEmployeeContractsAction = async (employeeId: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { employeeContractsByEmployeeId } = await client.request<{
      employeeContractsByEmployeeId: EmployeeContract[];
    }>(ListByEmployeeDocument, { employeeId });
    return { success: true as const, data: employeeContractsByEmployeeId };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to load contracts", data: [] as EmployeeContract[] };
  }
};

const CreateDocument = gql`
  mutation CreateEmployeeContract($input: CreateEmployeeContractInput!) {
    createEmployeeContract(input: $input) {
      id
    }
  }
`;

const UpdateDocument = gql`
  mutation UpdateEmployeeContract($input: UpdateEmployeeContractInput!) {
    updateEmployeeContract(input: $input) {
      id
    }
  }
`;

const DeleteDocument = gql`
  mutation DeleteEmployeeContract($id: ID!) {
    deleteEmployeeContract(id: $id)
  }
`;

import { resolveContractScheduleFields } from "../lib/resolve-contract-schedule";

/** Handles Date and ISO strings from server-action serialization. */
const toIsoDate = (d: Date | string | null | undefined) => {
  if (!d) return undefined;
  if (typeof d === "string") return d.split("T")[0] || undefined;
  return d.toISOString().split("T")[0];
};

export const saveEmployeeContractAction = async (
  values: EmployeeContractFormOutput,
  hiddenByPermission: ContractTypeDependentField[] = [],
) => {
  const locale = await getLocale();
  const schema =
    hiddenByPermission.length === 0
      ? EmployeeContractFormSchema
      : buildEmployeeContractFormSchema(new Set(hiddenByPermission));
  let parsed: EmployeeContractFormOutput;
  try {
    parsed = clearHiddenContractFormFields(schema.parse(values));
    // Fields the caller cannot write must never reach the mutation, even
    // with a falsy default value (e.g. has13thSalary: false) — the backend
    // FieldWriteGuard rejects the request outright if the key is present.
    for (const field of hiddenByPermission) {
      (parsed as Record<string, unknown>)[field] = null;
    }
  } catch (error) {
    console.error("Contract form validation failed", error);
    return {
      success: false as const,
      error: "Validation failed — check required contract fields",
    };
  }
  const client = await serverCookieGqlClient();
  const schedule = resolveContractScheduleFields(parsed);

  const base = {
    employeeId: parsed.employeeId,
    startDate: toIsoDate(parsed.startDate) ?? "",
    endDate: toIsoDate(parsed.endDate),
    probationEndDate: toIsoDate(parsed.probationEndDate),
    contractType: parsed.contractType || undefined,
    position: parsed.position || undefined,
    supervisorMembershipId: parsed.supervisorMembershipId || null,
    workloadPercent:
      parsed.workloadPercent === null ? undefined : parsed.workloadPercent,
    weeklyHours: parsed.weeklyHours || undefined,
    grossSalary: parsed.grossSalary === null ? undefined : parsed.grossSalary,
    hourlyRate: parsed.hourlyRate === null ? undefined : parsed.hourlyRate,
    paymentInterval: parsed.paymentInterval || undefined,
    has13thSalary:
      parsed.has13thSalary === null ? undefined : parsed.has13thSalary,
    annualVacationDays:
      parsed.annualVacationDays === null
        ? undefined
        : parsed.annualVacationDays,
    remainingVacationDays: parsed.remainingVacationDays || undefined,
    notes: parsed.notes || undefined,
    documentUrl: parsed.documentUrl || undefined,
    weekdayTimeWindows: schedule.weekdayTimeWindows,
    weekdayWorkloads: schedule.weekdayWorkloads,
  };

  try {
    if (parsed.id) {
      await client.request(UpdateDocument, { input: { id: parsed.id, ...base } });
    } else {
      await client.request(CreateDocument, { input: base });
    }
    revalidatePath(`/${locale}/admin/employees`, "layout");
    return { success: true as const, data: null };
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Failed to save contract";
    return { success: false as const, error: message };
  }
};

export const deleteEmployeeContractAction = async (id: string) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    await client.request(DeleteDocument, { id });
    revalidatePath(`/${locale}/admin/employees`, "layout");
    return { success: true as const };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to delete contract" };
  }
};
