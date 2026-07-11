"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type StudentDetail = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  enrollmentDate?: string | null;
  exitDate?: string | null;
  notes?: string | null;
  preferredName?: string | null;
  placeOfBirth?: string | null;
  firstLanguages?: string[] | null;
  familyLanguages?: string[] | null;
  religion?: string | null;
  socialSecurityNumber?: string | null;
  externalStudentId?: string | null;
  nationalities?: string[] | null;
  isActive: boolean;
};

type GetStudentByIdResponse = {
  studentById: StudentDetail;
};

const GetStudentByIdDocument = gql`
  query GetStudentById($id: ID!) {
    studentById(id: $id) {
      id
      firstName
      lastName
      dateOfBirth
      gender
      enrollmentDate
      exitDate
      notes
      preferredName
      placeOfBirth
      firstLanguages
      familyLanguages
      religion
      socialSecurityNumber
      externalStudentId
      nationalities
      isActive
    }
  }
`;

export const getStudentByIdAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { studentById } =
      await client.request<GetStudentByIdResponse>(GetStudentByIdDocument, {
        id,
      });
    return { success: true as const, data: studentById };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to load student" };
  }
};
