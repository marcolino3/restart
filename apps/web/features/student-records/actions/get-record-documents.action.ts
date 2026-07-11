"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type StudentRecordDocument = {
  id: string;
  originalName: string;
  title: string | null;
  tags: string[];
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  uploadedByName: string | null;
};

const Document = gql`
  query StudentRecordDocumentsByEntry($entryId: ID!) {
    studentRecordDocumentsByEntry(entryId: $entryId) {
      id
      originalName
      title
      tags
      mimeType
      sizeBytes
      createdAt
      uploadedByMembership {
        id
        user {
          firstName
          lastName
        }
      }
    }
  }
`;

export const getStudentRecordDocumentsAction = async (
  entryId: string,
): Promise<
  | { success: true; data: StudentRecordDocument[] }
  | { success: false; error?: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const resp = await client.request<{
      studentRecordDocumentsByEntry: Array<{
        id: string;
        originalName: string;
        title: string | null;
        tags: string[];
        mimeType: string;
        sizeBytes: number;
        createdAt: string;
        uploadedByMembership: {
          id: string;
          user?: { firstName: string; lastName: string } | null;
        } | null;
      }>;
    }>(Document, { entryId });

    return {
      success: true,
      data: resp.studentRecordDocumentsByEntry.map((d) => ({
        id: d.id,
        originalName: d.originalName,
        title: d.title,
        tags: d.tags,
        mimeType: d.mimeType,
        sizeBytes: d.sizeBytes,
        createdAt: d.createdAt,
        uploadedByName: d.uploadedByMembership?.user
          ? `${d.uploadedByMembership.user.firstName} ${d.uploadedByMembership.user.lastName}`.trim()
          : null,
      })),
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load documents",
    };
  }
};
