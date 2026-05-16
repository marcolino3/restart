"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import {
  EmployeeContractFormSchema,
  EmployeeContractFormOutput,
} from "../schemas/employee-contract-form.schema";

export type EmployeeContractType =
  | "PERMANENT"
  | "TEMPORARY"
  | "INTERNSHIP"
  | "APPRENTICESHIP";

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
  paymentInterval?: EmployeePaymentInterval | null;
  has13thSalary?: boolean | null;
  annualVacationDays?: number | null;
  remainingVacationDays?: string | null;
  notes?: string | null;
  isActive: boolean;
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
      paymentInterval
      has13thSalary
      annualVacationDays
      remainingVacationDays
      notes
      isActive
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

const toIsoDate = (d: Date | null | undefined) =>
  d ? d.toISOString().split("T")[0] : undefined;

export const saveEmployeeContractAction = async (
  values: EmployeeContractFormOutput,
) => {
  const locale = await getLocale();
  const parsed = EmployeeContractFormSchema.parse(values);
  const client = await serverCookieGqlClient();

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
    paymentInterval: parsed.paymentInterval || undefined,
    has13thSalary:
      parsed.has13thSalary === null ? undefined : parsed.has13thSalary,
    annualVacationDays:
      parsed.annualVacationDays === null
        ? undefined
        : parsed.annualVacationDays,
    remainingVacationDays: parsed.remainingVacationDays || undefined,
    notes: parsed.notes || undefined,
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
    return { success: false as const, error: "Failed to save contract" };
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
