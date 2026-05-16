"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type EmployeeMaritalStatus =
  | "SINGLE"
  | "MARRIED"
  | "REGISTERED_PARTNERSHIP"
  | "SEPARATED"
  | "DIVORCED"
  | "WIDOWED";

export type EmployeeResidencePermitType =
  | "CITIZEN"
  | "B"
  | "C"
  | "L"
  | "G"
  | "F"
  | "OTHER";

export type EmployeeOnboardingStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED";

export type EmployeeHrProfile = {
  id: string;
  employeeId: string;
  iban?: string | null;
  bankAccountHolder?: string | null;
  bankName?: string | null;
  bvgProvider?: string | null;
  bvgInsuranceNumber?: string | null;
  uvgProvider?: string | null;
  withholdingTaxCode?: string | null;
  nationality?: string | null;
  residencePermitType?: EmployeeResidencePermitType | null;
  residencePermitValidUntil?: string | null;
  maritalStatus?: EmployeeMaritalStatus | null;
  denomination?: string | null;
  numberOfChildren?: number | null;
  onboardingStatus?: EmployeeOnboardingStatus | null;
  ndaSigned?: boolean | null;
  criminalRecordSubmitted?: boolean | null;
};

type Response = { employeeHrProfile: EmployeeHrProfile | null };

const Document = gql`
  query GetEmployeeHrProfile($employeeId: ID!) {
    employeeHrProfile(employeeId: $employeeId) {
      id
      employeeId
      iban
      bankAccountHolder
      bankName
      bvgProvider
      bvgInsuranceNumber
      uvgProvider
      withholdingTaxCode
      nationality
      residencePermitType
      residencePermitValidUntil
      maritalStatus
      denomination
      numberOfChildren
      onboardingStatus
      ndaSigned
      criminalRecordSubmitted
    }
  }
`;

export const getEmployeeHrProfileAction = async (employeeId: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { employeeHrProfile } = await client.request<Response>(Document, {
      employeeId,
    });
    return { success: true as const, data: employeeHrProfile };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: "Failed to load HR profile",
      data: null,
    };
  }
};
