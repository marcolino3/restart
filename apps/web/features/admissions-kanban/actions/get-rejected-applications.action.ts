"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { AdmissionRejectedBy, RejectedApplication } from "../types";

const Document = gql`
  query RejectedAdmissionApplications {
    admissionApplications(includeFinished: true) {
      id
      status
      childFirstName
      childLastName
      stageEnteredAt
      rejectionReason
      rejectionReasonId
      rejectedBy
      family {
        name
      }
      desiredGradeLevel {
        name
      }
    }
    admissionRejectionReasons(includeArchived: true) {
      id
      label
      color
    }
  }
`;

type Resp = {
  admissionApplications: Array<{
    id: string;
    status: string;
    childFirstName: string;
    childLastName: string;
    stageEnteredAt: string;
    rejectionReason: string | null;
    rejectionReasonId: string | null;
    rejectedBy: AdmissionRejectedBy | null;
    family: { name: string | null } | null;
    desiredGradeLevel: { name: string } | null;
  }>;
  admissionRejectionReasons: Array<{
    id: string;
    label: string;
    color: string | null;
  }>;
};

export const getRejectedApplicationsAction = async (): Promise<
  | { success: true; data: RejectedApplication[] }
  | { success: false; error?: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const data = await client.request<Resp>(Document);
    const reasonById = new Map(
      data.admissionRejectionReasons.map((r) => [r.id, r]),
    );

    const rejected: RejectedApplication[] = data.admissionApplications
      .filter((a) => a.status === "REJECTED")
      .map((a) => {
        const ref = a.rejectionReasonId
          ? reasonById.get(a.rejectionReasonId)
          : undefined;
        return {
          id: a.id,
          childFirstName: a.childFirstName,
          childLastName: a.childLastName,
          familyName: a.family?.name ?? null,
          desiredGradeLevelName: a.desiredGradeLevel?.name ?? null,
          rejectionReason: a.rejectionReason,
          rejectionReasonLabel: ref?.label ?? null,
          rejectionReasonColor: ref?.color ?? null,
          rejectedBy: a.rejectedBy,
          rejectedAt: a.stageEnteredAt,
        };
      })
      .sort(
        (x, y) =>
          new Date(y.rejectedAt).getTime() - new Date(x.rejectedAt).getTime(),
      );

    return { success: true as const, data: rejected };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Failed to load rejections",
    };
  }
};
