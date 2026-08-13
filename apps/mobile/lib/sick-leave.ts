import { gql } from "graphql-request";
import { gqlClient } from "./gql-client";

const ReportSickLeaveDocument = gql`
  mutation ReportSickLeave($input: ReportSickLeaveInput!) {
    reportSickLeave(input: $input) {
      isExtension
      isUnchanged
      absence {
        id
        startDate
        endDate
      }
    }
  }
`;

export type ReportSickLeaveInput = {
  /** Local "YYYY-MM-DD" — the day the report applies to. */
  date: string;
  /** Local "HH:mm". Omitted means sick from the start of the day. */
  startTime?: string | null;
  comment?: string | null;
};

export type ReportedSickLeave = {
  id: string;
  startDate: string;
  endDate: string;
};

export type ReportSickLeaveResult = {
  absence: ReportedSickLeave;
  /** An existing absence was extended instead of a new one created. */
  isExtension: boolean;
  /** The day was already covered — nothing was written, nobody notified. */
  isUnchanged: boolean;
};

export async function reportSickLeave(
  input: ReportSickLeaveInput,
): Promise<ReportSickLeaveResult> {
  const { reportSickLeave: result } = await gqlClient.request<{
    reportSickLeave: ReportSickLeaveResult;
  }>(ReportSickLeaveDocument, { input });
  return result;
}
