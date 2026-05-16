"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type EmergencyContactRelationship =
  | "SPOUSE"
  | "PARTNER"
  | "PARENT"
  | "CHILD"
  | "SIBLING"
  | "FRIEND"
  | "OTHER";

export type BloodType =
  | "A_POS"
  | "A_NEG"
  | "B_POS"
  | "B_NEG"
  | "AB_POS"
  | "AB_NEG"
  | "O_POS"
  | "O_NEG";

export type EmployeeEmergencyProfile = {
  id: string;
  employeeId: string;
  contact1Name?: string | null;
  contact1Relationship?: EmergencyContactRelationship | null;
  contact1Phone?: string | null;
  contact1Email?: string | null;
  contact2Name?: string | null;
  contact2Relationship?: EmergencyContactRelationship | null;
  contact2Phone?: string | null;
  contact2Email?: string | null;
  bloodType?: BloodType | null;
  allergies?: string | null;
  chronicConditions?: string | null;
  emergencyMedications?: string | null;
  primaryDoctorName?: string | null;
  primaryDoctorPhone?: string | null;
  pharmacyName?: string | null;
};

type Response = { employeeEmergencyProfile: EmployeeEmergencyProfile | null };

const GetEmployeeEmergencyProfileDocument = gql`
  query GetEmployeeEmergencyProfile($employeeId: ID!) {
    employeeEmergencyProfile(employeeId: $employeeId) {
      id
      employeeId
      contact1Name
      contact1Relationship
      contact1Phone
      contact1Email
      contact2Name
      contact2Relationship
      contact2Phone
      contact2Email
      bloodType
      allergies
      chronicConditions
      emergencyMedications
      primaryDoctorName
      primaryDoctorPhone
      pharmacyName
    }
  }
`;

export const getEmployeeEmergencyProfileAction = async (employeeId: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { employeeEmergencyProfile } = await client.request<Response>(
      GetEmployeeEmergencyProfileDocument,
      { employeeId },
    );
    return { success: true as const, data: employeeEmergencyProfile };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: "Failed to load emergency profile",
      data: null,
    };
  }
};
