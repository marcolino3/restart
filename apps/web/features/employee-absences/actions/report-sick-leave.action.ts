"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import {
  ReportSickLeaveFormSchema,
  ReportSickLeaveFormType,
} from "../schemas/report-sick-leave-form.schema";
import { graphql } from "@restart/shared-types";
import { ReportSickLeaveMutation } from "@restart/shared-types/graphql";

const ReportSickLeaveDocument = graphql(`
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
`);

/** `Date` to `YYYY-MM-DD` in local time — a sick day is a calendar day. */
const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

export const reportSickLeaveAction = async (
  values: ReportSickLeaveFormType
) => {
  const client = await serverCookieGqlClient();

  const parsed = ReportSickLeaveFormSchema.parse(values);

  try {
    const { reportSickLeave } = await client.request<ReportSickLeaveMutation>(
      ReportSickLeaveDocument,
      {
        input: {
          date: toIsoDate(parsed.date),
          // Only sent when the employee explicitly picked a time.
          startTime: parsed.hasStartTime ? parsed.startTime : null,
          comment: parsed.comment.trim() || null,
        },
      }
    );

    return {
      success: true,
      data: reportSickLeave.absence.id,
      isExtension: reportSickLeave.isExtension,
      isUnchanged: reportSickLeave.isUnchanged,
    };
  } catch (error) {
    console.log(error);
    return { success: false };
  }
};
