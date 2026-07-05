"use server";

import { gql } from "graphql-request";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import type { Consent } from "../types";
import type { ConsentSubjectType } from "../schemas/consent-purpose-form.schema";

const ConsentsForSubjectDocument = gql`
  query ConsentsForSubject(
    $subjectType: ConsentSubjectType!
    $subjectId: ID!
  ) {
    consentsForSubject(subjectType: $subjectType, subjectId: $subjectId) {
      id
      subjectType
      subjectId
      purposeId
      status
      grantedByContactPersonId
      decidedAt
      withdrawnAt
      evidenceUrl
      note
      purpose {
        id
        name
        slug
      }
    }
  }
`;

type ConsentsForSubjectResponse = {
  consentsForSubject: Consent[];
};

export const getConsentsForSubjectAction = async (
  subjectType: ConsentSubjectType,
  subjectId: string,
) => {
  try {
    const client = await serverCookieGqlClient();
    const { consentsForSubject } =
      await client.request<ConsentsForSubjectResponse>(
        ConsentsForSubjectDocument,
        { subjectType, subjectId },
      );
    return { success: true as const, data: consentsForSubject };
  } catch (error) {
    console.log(error);
    return { success: false as const, error, data: [] as Consent[] };
  }
};
