import { gql } from "graphql-request";
import { gqlClient } from "./gql-client";

export type AbsenceStatus = "PENDING" | "APPROVED" | "REJECTED";

export type AbsenceCategoryTranslation = {
  locale: string;
  name: string;
};

export type AbsenceCategory = {
  id: string;
  systemCode?: string | null;
  requiresApproval: boolean;
  isActive: boolean;
  translations?: AbsenceCategoryTranslation[] | null;
};

export type MyAbsence = {
  id: string;
  startDate: string;
  endDate?: string | null;
  note?: string | null;
  status: AbsenceStatus;
  decisionNote?: string | null;
  absenceCategory?: {
    id: string;
    systemCode?: string | null;
    translations?: AbsenceCategoryTranslation[] | null;
  } | null;
};

const CategoriesDocument = gql`
  query MobileAbsenceCategories {
    employeeAbsenceCategoriesByOrgId {
      id
      systemCode
      requiresApproval
      isActive
      translations {
        locale
        name
      }
    }
  }
`;

const MyAbsencesDocument = gql`
  query MobileMyAbsences {
    myEmployeeAbsences {
      id
      startDate
      endDate
      note
      status
      decisionNote
      absenceCategory {
        id
        systemCode
        translations {
          locale
          name
        }
      }
    }
  }
`;

const CreateNoticeDocument = gql`
  mutation MobileCreateAbsenceNotice(
    $createEmployeeAbsenceInput: CreateEmployeeAbsenceNoticeInput!
  ) {
    createEmployeeAbsenceNotice(
      createEmployeeAbsenceInput: $createEmployeeAbsenceInput
    ) {
      id
      status
    }
  }
`;

const WithdrawDocument = gql`
  mutation MobileWithdrawAbsenceRequest($id: ID!) {
    withdrawMyEmployeeAbsenceRequest(id: $id)
  }
`;

export async function fetchAbsenceCategories(): Promise<AbsenceCategory[]> {
  const { employeeAbsenceCategoriesByOrgId } = await gqlClient.request<{
    employeeAbsenceCategoriesByOrgId: AbsenceCategory[];
  }>(CategoriesDocument);
  return employeeAbsenceCategoriesByOrgId.filter((c) => c.isActive);
}

export async function fetchMyAbsences(): Promise<MyAbsence[]> {
  const { myEmployeeAbsences } = await gqlClient.request<{
    myEmployeeAbsences: MyAbsence[];
  }>(MyAbsencesDocument);
  return myEmployeeAbsences;
}

export type CreateAbsenceNoticeInput = {
  /** Local "YYYY-MM-DD". */
  startDate: string;
  endDate?: string | null;
  absenceCategoryId: string;
  note: string;
  isTeamInformed: boolean;
};

export async function createAbsenceNotice(
  input: CreateAbsenceNoticeInput,
): Promise<{ id: string; status: AbsenceStatus }> {
  const { createEmployeeAbsenceNotice } = await gqlClient.request<{
    createEmployeeAbsenceNotice: { id: string; status: AbsenceStatus };
  }>(CreateNoticeDocument, { createEmployeeAbsenceInput: input });
  return createEmployeeAbsenceNotice;
}

export async function withdrawAbsenceRequest(id: string): Promise<boolean> {
  const { withdrawMyEmployeeAbsenceRequest } = await gqlClient.request<{
    withdrawMyEmployeeAbsenceRequest: boolean;
  }>(WithdrawDocument, { id });
  return withdrawMyEmployeeAbsenceRequest;
}

/** Category name in the requested locale, falling back to DE/EN and the code. */
export function absenceCategoryName(
  category:
    | { systemCode?: string | null; translations?: AbsenceCategoryTranslation[] | null }
    | null
    | undefined,
  locale: string,
): string {
  if (!category) return "–";
  const order = [locale.toUpperCase(), "DE", "EN", "FR", "IT"];
  for (const loc of order) {
    const hit = category.translations?.find((tr) => tr.locale === loc);
    if (hit?.name) return hit.name;
  }
  return category.systemCode ?? "–";
}
