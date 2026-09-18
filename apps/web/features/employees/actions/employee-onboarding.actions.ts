"use server";

import {
  EmployeeOnboardingFormSchema,
  EmployeeOnboardingFormOutput,
} from "../schemas/employee-onboarding-form.schema";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/constants/routes";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";
import { toOnboardingInput, ONBOARDING_CONTRACT_FIELDS } from "../lib/to-onboarding-input";

const UpsertDraftDocument = gql`
  mutation UpsertEmployeeOnboardingDraft($input: EmployeeOnboardingInput!) {
    upsertEmployeeOnboardingDraft(input: $input) {
      id
      status
      invitationStatus
      version
    }
  }
`;

type UpsertDraftResponse = {
  upsertEmployeeOnboardingDraft: {
    id: string;
    status: string;
    invitationStatus: string;
    version: number;
  };
};

/** Create or patch the auto-saving onboarding draft. Returns the employee id. */
export const upsertEmployeeOnboardingDraftAction = async (
  values: EmployeeOnboardingFormOutput,
  changedFields?: string[],
) => {
  try {
    const basisOnly = changedFields && !changedFields.some((field) => ONBOARDING_CONTRACT_FIELDS.includes(field));
    const submitted = basisOnly ? Object.fromEntries(Object.entries(values).filter(([key]) => !ONBOARDING_CONTRACT_FIELDS.includes(key))) : values;
    const validation = EmployeeOnboardingFormSchema.safeParse(submitted);
    if (!validation.success) return { success: false as const, error: "Invalid employee fields", fieldErrors: validation.error.flatten().fieldErrors };
    const parsed = validation.data;
    const locale = await getLocale();
    const client = await serverCookieGqlClient();
    const { upsertEmployeeOnboardingDraft } =
      await client.request<UpsertDraftResponse>(UpsertDraftDocument, {
        input: toOnboardingInput(parsed, changedFields),
      });
    revalidatePath(ROUTES.admin.employees(locale));
    if (parsed.id) {
      revalidatePath(ROUTES.admin.employeesView(locale, parsed.id));
      revalidatePath(ROUTES.admin.employeesEdit(locale, parsed.id));
    }
    return { success: true as const, data: upsertEmployeeOnboardingDraft };
  } catch (error) {
    const code = (error as { response?: { errors?: { extensions?: { code?: string } }[] } })?.response?.errors?.[0]?.extensions?.code;
    return { success: false as const, error: code === 'CONFLICT' ? 'Employee was changed; reload before saving' : code === 'FORBIDDEN' ? 'Permission denied' : 'Employee could not be saved' };
  }
};

const FinalizeDocument = gql`
  mutation FinalizeEmployeeOnboarding($input: FinalizeEmployeeOnboardingInput!) {
    finalizeEmployeeOnboarding(input: $input) {
      id
      status
      invitationStatus
      version
    }
  }
`;

type FinalizeResponse = {
  finalizeEmployeeOnboarding: {
    id: string;
    status: string;
    invitationStatus: string;
    version: number;
  };
};

/** Finalize a draft: validate completeness, activate, dispatch invitation. */
export const finalizeEmployeeOnboardingAction = async (input: {
  id: string;
  invitationTiming: "IMMEDIATE" | "ON_ENTRY_DATE" | "MANUAL";
  expectedVersion: number;
}) => {
  try {
    const locale = await getLocale();
    const client = await serverCookieGqlClient();
    const { finalizeEmployeeOnboarding } =
      await client.request<FinalizeResponse>(FinalizeDocument, { input });
    revalidatePath(ROUTES.admin.employees(locale));
    return { success: true as const, data: finalizeEmployeeOnboarding };
  } catch {
    return { success: false as const, error: 'Employee could not be finalized' };
  }
};

const SendInvitationDocument = gql`
  mutation SendEmployeeInvitation($employeeId: ID!) {
    sendEmployeeInvitation(employeeId: $employeeId) {
      id
      invitationStatus
      version
    }
  }
`;

type SendInvitationResponse = {
  sendEmployeeInvitation: { id: string; invitationStatus: string };
};

/** Manually (re-)send the first-login invitation. */
export const sendEmployeeInvitationAction = async (employeeId: string) => {
  try {
    const locale = await getLocale();
    const client = await serverCookieGqlClient();
    const { sendEmployeeInvitation } =
      await client.request<SendInvitationResponse>(SendInvitationDocument, {
        employeeId,
      });
    revalidatePath(ROUTES.admin.employees(locale));
    return { success: true as const, data: sendEmployeeInvitation };
  } catch {
    return { success: false as const, error: 'Invitation could not be sent' };
  }
};

export const removeEmployeeDraftAction = async (employeeId: string) => {
  try {
    const client = await serverCookieGqlClient();
    await client.request(gql`
      mutation RemoveEmployeeDraft($employeeId: ID!) {
        removeEmployeeOnboardingDraft(employeeId: $employeeId)
      }
    `, { employeeId });
    revalidatePath(ROUTES.admin.employees(await getLocale()));
    return { success: true as const };
  } catch {
    return { success: false as const };
  }
};
