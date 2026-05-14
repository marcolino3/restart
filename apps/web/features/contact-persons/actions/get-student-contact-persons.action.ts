"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type StudentContactPersonItem = {
  id: string;
  relationshipType: string;
  isPrimaryContact: boolean;
  hasCustody: boolean;
  isPickupAuthorized: boolean;
  emergencyPriority?: number | null;
  livesWithStudent: boolean;
  notes?: string | null;
  contactPerson: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    mobile?: string | null;
  };
};

const GetContactPersonsByStudentIdDocument = gql`
  query GetContactPersonsByStudentId($studentId: ID!) {
    contactPersonsByStudentId(studentId: $studentId) {
      id
      relationshipType
      isPrimaryContact
      hasCustody
      isPickupAuthorized
      emergencyPriority
      livesWithStudent
      notes
      contactPerson {
        id
        firstName
        lastName
        email
        phone
        mobile
      }
    }
  }
`;

export const getStudentContactPersonsAction = async (studentId: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { contactPersonsByStudentId } = await client.request<{
      contactPersonsByStudentId: StudentContactPersonItem[];
    }>(GetContactPersonsByStudentIdDocument, { studentId });
    return { success: true as const, data: contactPersonsByStudentId };
  } catch (error) {
    console.log(error);
    return { success: false as const };
  }
};
