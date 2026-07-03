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

const toIsoDate = (d: Date | null | undefined): string | undefined =>
  d ? d.toISOString().split("T")[0] : undefined;

const emptyToUndef = (s: string | null | undefined): string | undefined =>
  s && s.trim() ? s.trim() : undefined;

/** Maps the wizard form output onto the EmployeeOnboardingInput GraphQL shape. */
function toOnboardingInput(values: EmployeeOnboardingFormOutput) {
  const contract = {
    contractType: values.contractType || undefined,
    position: emptyToUndef(values.position),
    startDate: toIsoDate(values.startDate),
    endDate: toIsoDate(values.endDate),
    workloadPercent: values.workloadPercent ?? undefined,
    weeklyHours: emptyToUndef(values.weeklyHours),
    annualVacationDays: values.annualVacationDays ?? undefined,
    weekdayTimeWindows: values.weekdayTimeWindows ?? undefined,
  };
  const hasContract = Object.values(contract).some((v) => v !== undefined);

  return {
    id: values.id,
    title: emptyToUndef(values.title),
    firstName: values.firstName,
    lastName: values.lastName,
    email: emptyToUndef(values.email),
    persona: values.persona,
    dateOfBirth: toIsoDate(values.dateOfBirth),
    socialSecurityNumber: emptyToUndef(values.socialSecurityNumber),
    contactPhone: emptyToUndef(values.contactPhone),
    street: emptyToUndef(values.street),
    houseNumber: emptyToUndef(values.houseNumber),
    addressLine2: emptyToUndef(values.addressLine2),
    postalCode: emptyToUndef(values.postalCode),
    city: emptyToUndef(values.city),
    country: emptyToUndef(values.country),
    avatarUrl: emptyToUndef(values.avatarUrl),
    timeTrackingEnabled: values.timeTrackingEnabled,
    teamId: values.teamId ?? undefined,
    roleIds: values.roleIds,
    language: values.language,
    ...(hasContract ? { contract } : {}),
  };
}

const UpsertDraftDocument = gql`
  mutation UpsertEmployeeOnboardingDraft($input: EmployeeOnboardingInput!) {
    upsertEmployeeOnboardingDraft(input: $input) {
      id
      status
      invitationStatus
    }
  }
`;

type UpsertDraftResponse = {
  upsertEmployeeOnboardingDraft: {
    id: string;
    status: string;
    invitationStatus: string;
  };
};

/** Create or patch the auto-saving onboarding draft. Returns the employee id. */
export const upsertEmployeeOnboardingDraftAction = async (
  values: EmployeeOnboardingFormOutput,
) => {
  const parsed = EmployeeOnboardingFormSchema.parse(values);
  const client = await serverCookieGqlClient();
  try {
    const { upsertEmployeeOnboardingDraft } =
      await client.request<UpsertDraftResponse>(UpsertDraftDocument, {
        input: toOnboardingInput(parsed),
      });
    return { success: true as const, data: upsertEmployeeOnboardingDraft };
  } catch (error) {
    return { success: false as const, error };
  }
};

const FinalizeDocument = gql`
  mutation FinalizeEmployeeOnboarding($input: FinalizeEmployeeOnboardingInput!) {
    finalizeEmployeeOnboarding(input: $input) {
      id
      status
      invitationStatus
    }
  }
`;

type FinalizeResponse = {
  finalizeEmployeeOnboarding: {
    id: string;
    status: string;
    invitationStatus: string;
  };
};

/** Finalize a draft: validate completeness, activate, dispatch invitation. */
export const finalizeEmployeeOnboardingAction = async (input: {
  id: string;
  invitationTiming: "IMMEDIATE" | "ON_ENTRY_DATE" | "MANUAL";
}) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { finalizeEmployeeOnboarding } =
      await client.request<FinalizeResponse>(FinalizeDocument, { input });
    revalidatePath(ROUTES.admin.employees(locale));
    return { success: true as const, data: finalizeEmployeeOnboarding };
  } catch (error) {
    return { success: false as const, error };
  }
};

const SendInvitationDocument = gql`
  mutation SendEmployeeInvitation($employeeId: ID!) {
    sendEmployeeInvitation(employeeId: $employeeId) {
      id
      invitationStatus
    }
  }
`;

type SendInvitationResponse = {
  sendEmployeeInvitation: { id: string; invitationStatus: string };
};

/** Manually (re-)send the first-login invitation. */
export const sendEmployeeInvitationAction = async (employeeId: string) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { sendEmployeeInvitation } =
      await client.request<SendInvitationResponse>(SendInvitationDocument, {
        employeeId,
      });
    revalidatePath(ROUTES.admin.employees(locale));
    return { success: true as const, data: sendEmployeeInvitation };
  } catch (error) {
    return { success: false as const, error };
  }
};
