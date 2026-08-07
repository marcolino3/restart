"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { ROUTES } from "@/constants/routes";

export type Holiday = {
  id: string;
  date: string;
  name: string;
  paidPercentage: number;
  repeatsYearly: boolean;
};

/**
 * Feiertag im Zeitraum einer Betriebsferien; `date` ist das aufgeloeste Datum.
 * `isWeekend` markiert Feiertage auf Sa/So — sie sparen keinen Ferientag.
 */
export type CompanyVacationHoliday = {
  date: string;
  name: string;
  paidPercentage: number;
  isWeekend: boolean;
};

export type CompanyVacation = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  effectiveDays: number;
  holidays: CompanyVacationHoliday[];
};

const SettingsDocument = gql`
  query TimeTrackingSettings {
    holidays {
      id
      date
      name
      paidPercentage
      repeatsYearly
    }
    companyVacations {
      id
      name
      startDate
      endDate
      effectiveDays
      holidays {
        date
        name
        paidPercentage
        isWeekend
      }
    }
  }
`;

export const getTimeTrackingSettingsAction = async (): Promise<{
  holidays: Holiday[];
  companyVacations: CompanyVacation[];
}> => {
  const client = await serverCookieGqlClient();
  try {
    const data = await client.request<{
      holidays: Holiday[];
      companyVacations: CompanyVacation[];
    }>(SettingsDocument);
    return {
      holidays: data.holidays ?? [],
      companyVacations: data.companyVacations ?? [],
    };
  } catch (error) {
    console.error("getTimeTrackingSettingsAction", error);
    return { holidays: [], companyVacations: [] };
  }
};

async function revalidate() {
  const locale = await getLocale();
  revalidatePath(ROUTES.admin.timeTrackingSettings(locale));
}

const CreateHolidayDocument = gql`
  mutation CreateHoliday($input: CreateHolidayInput!) {
    createHoliday(input: $input) {
      id
    }
  }
`;
const UpdateHolidayDocument = gql`
  mutation UpdateHoliday($input: UpdateHolidayInput!) {
    updateHoliday(input: $input) {
      id
    }
  }
`;
const DeleteHolidayDocument = gql`
  mutation DeleteHoliday($id: ID!) {
    deleteHoliday(id: $id)
  }
`;
const CreateCompanyVacationDocument = gql`
  mutation CreateCompanyVacation($input: CreateCompanyVacationInput!) {
    createCompanyVacation(input: $input) {
      id
    }
  }
`;
const UpdateCompanyVacationDocument = gql`
  mutation UpdateCompanyVacation($input: UpdateCompanyVacationInput!) {
    updateCompanyVacation(input: $input) {
      id
    }
  }
`;
const DeleteCompanyVacationDocument = gql`
  mutation DeleteCompanyVacation($id: ID!) {
    deleteCompanyVacation(id: $id)
  }
`;

export const createHolidayAction = async (input: {
  date: string;
  name: string;
  paidPercentage: number;
  repeatsYearly?: boolean;
}) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(CreateHolidayDocument, { input });
    await revalidate();
    return { success: true as const, data: true };
  } catch (error) {
    return { success: false as const, error };
  }
};

export const updateHolidayAction = async (input: {
  id: string;
  date: string;
  name: string;
  paidPercentage: number;
  repeatsYearly?: boolean;
}) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(UpdateHolidayDocument, { input });
    await revalidate();
    return { success: true as const, data: true };
  } catch (error) {
    return { success: false as const, error };
  }
};

export const deleteHolidayAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(DeleteHolidayDocument, { id });
    await revalidate();
    return { success: true as const, data: true };
  } catch (error) {
    return { success: false as const, error };
  }
};

export const createCompanyVacationAction = async (input: {
  name: string;
  startDate: string;
  endDate: string;
}) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(CreateCompanyVacationDocument, { input });
    await revalidate();
    return { success: true as const, data: true };
  } catch (error) {
    return { success: false as const, error };
  }
};

export const updateCompanyVacationAction = async (input: {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(UpdateCompanyVacationDocument, { input });
    await revalidate();
    return { success: true as const, data: true };
  } catch (error) {
    return { success: false as const, error };
  }
};

export const deleteCompanyVacationAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(DeleteCompanyVacationDocument, { id });
    await revalidate();
    return { success: true as const, data: true };
  } catch (error) {
    return { success: false as const, error };
  }
};
