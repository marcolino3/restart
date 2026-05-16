"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import {
  EmployeeEmergencyFormSchema,
  EmployeeEmergencyFormOutput,
} from "../schemas/employee-emergency-form.schema";

const UpsertDocument = gql`
  mutation UpsertEmployeeEmergencyProfile(
    $input: UpsertEmployeeEmergencyProfileInput!
  ) {
    upsertEmployeeEmergencyProfile(input: $input) {
      id
    }
  }
`;

export const upsertEmployeeEmergencyProfileAction = async (
  values: EmployeeEmergencyFormOutput,
) => {
  const locale = await getLocale();
  const parsed = EmployeeEmergencyFormSchema.parse(values);
  const client = await serverCookieGqlClient();

  const input = {
    employeeId: parsed.employeeId,
    ...(parsed.contact1Name !== undefined && {
      contact1Name: parsed.contact1Name ?? "",
    }),
    ...(parsed.contact1Relationship !== undefined && {
      contact1Relationship: parsed.contact1Relationship || undefined,
    }),
    ...(parsed.contact1Phone !== undefined && {
      contact1Phone: parsed.contact1Phone ?? "",
    }),
    ...(parsed.contact1Email !== undefined && {
      contact1Email: parsed.contact1Email ?? "",
    }),
    ...(parsed.contact2Name !== undefined && {
      contact2Name: parsed.contact2Name ?? "",
    }),
    ...(parsed.contact2Relationship !== undefined && {
      contact2Relationship: parsed.contact2Relationship || undefined,
    }),
    ...(parsed.contact2Phone !== undefined && {
      contact2Phone: parsed.contact2Phone ?? "",
    }),
    ...(parsed.contact2Email !== undefined && {
      contact2Email: parsed.contact2Email ?? "",
    }),
    ...(parsed.bloodType !== undefined && {
      bloodType: parsed.bloodType || undefined,
    }),
    ...(parsed.allergies !== undefined && { allergies: parsed.allergies ?? "" }),
    ...(parsed.chronicConditions !== undefined && {
      chronicConditions: parsed.chronicConditions ?? "",
    }),
    ...(parsed.emergencyMedications !== undefined && {
      emergencyMedications: parsed.emergencyMedications ?? "",
    }),
    ...(parsed.primaryDoctorName !== undefined && {
      primaryDoctorName: parsed.primaryDoctorName ?? "",
    }),
    ...(parsed.primaryDoctorPhone !== undefined && {
      primaryDoctorPhone: parsed.primaryDoctorPhone ?? "",
    }),
    ...(parsed.pharmacyName !== undefined && {
      pharmacyName: parsed.pharmacyName ?? "",
    }),
  };

  try {
    const { upsertEmployeeEmergencyProfile } = await client.request<{
      upsertEmployeeEmergencyProfile: { id: string };
    }>(UpsertDocument, { input });
    revalidatePath(`/${locale}/admin/employees`);
    return { success: true as const, data: upsertEmployeeEmergencyProfile };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to save emergency profile" };
  }
};
