"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import {
  EmployeeHrProfileFormSchema,
  EmployeeHrProfileFormOutput,
} from "../schemas/employee-hr-profile-form.schema";

const UpsertEmployeeHrProfileDocument = gql`
  mutation UpsertEmployeeHrProfile($input: UpsertEmployeeHrProfileInput!) {
    upsertEmployeeHrProfile(input: $input) {
      id
    }
  }
`;

export const upsertEmployeeHrProfileAction = async (
  values: EmployeeHrProfileFormOutput,
) => {
  const locale = await getLocale();
  const parsed = EmployeeHrProfileFormSchema.parse(values);
  const client = await serverCookieGqlClient();

  const toIsoDate = (d: Date | null | undefined) =>
    d ? d.toISOString().split("T")[0] : undefined;

  const input = {
    employeeId: parsed.employeeId,
    ...(parsed.iban !== undefined && { iban: parsed.iban ?? "" }),
    ...(parsed.bankAccountHolder !== undefined && {
      bankAccountHolder: parsed.bankAccountHolder ?? "",
    }),
    ...(parsed.bankName !== undefined && { bankName: parsed.bankName ?? "" }),
    ...(parsed.bvgProvider !== undefined && {
      bvgProvider: parsed.bvgProvider ?? "",
    }),
    ...(parsed.bvgInsuranceNumber !== undefined && {
      bvgInsuranceNumber: parsed.bvgInsuranceNumber ?? "",
    }),
    ...(parsed.uvgProvider !== undefined && {
      uvgProvider: parsed.uvgProvider ?? "",
    }),
    ...(parsed.withholdingTaxCode !== undefined && {
      withholdingTaxCode: parsed.withholdingTaxCode ?? "",
    }),
    ...(parsed.nationality !== undefined && {
      nationality: parsed.nationality ?? "",
    }),
    ...(parsed.residencePermitType !== undefined && {
      residencePermitType: parsed.residencePermitType || undefined,
    }),
    ...(parsed.residencePermitValidUntil !== undefined && {
      residencePermitValidUntil:
        toIsoDate(parsed.residencePermitValidUntil) ?? "",
    }),
    ...(parsed.maritalStatus !== undefined && {
      maritalStatus: parsed.maritalStatus || undefined,
    }),
    ...(parsed.denomination !== undefined && {
      denomination: parsed.denomination ?? "",
    }),
    ...(parsed.numberOfChildren !== undefined && {
      numberOfChildren:
        parsed.numberOfChildren === null ? undefined : parsed.numberOfChildren,
    }),
    ...(parsed.onboardingStatus !== undefined && {
      onboardingStatus: parsed.onboardingStatus || undefined,
    }),
    ...(parsed.ndaSigned !== undefined && {
      ndaSigned: parsed.ndaSigned === null ? undefined : parsed.ndaSigned,
    }),
    ...(parsed.criminalRecordSubmitted !== undefined && {
      criminalRecordSubmitted:
        parsed.criminalRecordSubmitted === null
          ? undefined
          : parsed.criminalRecordSubmitted,
    }),
  };

  try {
    const { upsertEmployeeHrProfile } = await client.request<{
      upsertEmployeeHrProfile: { id: string };
    }>(UpsertEmployeeHrProfileDocument, { input });
    revalidatePath(`/${locale}/admin/employees`);
    return { success: true as const, data: upsertEmployeeHrProfile };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to save HR profile" };
  }
};
