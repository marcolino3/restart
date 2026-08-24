"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import {
  EmployeeAbsenceNoticeFormSchema,
  EmployeeAbsenceNoticeFormType,
} from "../schemas/employee-absence-notice-form.schema";
import { toAbsenceIsoDate } from "@restart/shared-schemas/employee-absences/absence-date";
import { graphql } from "@restart/shared-types";
import { CreateEmployeeAbsenceNoticeMutation } from "@restart/shared-types/graphql";

const CreateEmployeeAbsenceNoticeDocument = graphql(`
  mutation CreateEmployeeAbsenceNotice(
    $createEmployeeAbsenceInput: CreateEmployeeAbsenceNoticeInput!
  ) {
    createEmployeeAbsenceNotice(
      createEmployeeAbsenceInput: $createEmployeeAbsenceInput
    ) {
      id
    }
  }
`);

export const createEmployeeAbsenceNoticeAction = async (
  values: EmployeeAbsenceNoticeFormType,
) => {
  const client = await serverCookieGqlClient();

  const parsed = EmployeeAbsenceNoticeFormSchema.parse(values);
  // Self-service absences are whole days: send calendar dates only so the
  // stored value carries no time of day (the table would otherwise show one).
  const parsedValues = {
    ...parsed,
    startDate:
      toAbsenceIsoDate(parsed.startDate) ?? parsed.startDate.toISOString(),
    endDate: parsed.endDate ? (toAbsenceIsoDate(parsed.endDate) ?? null) : null,
  };

  try {
    const { createEmployeeAbsenceNotice } =
      await client.request<CreateEmployeeAbsenceNoticeMutation>(
        CreateEmployeeAbsenceNoticeDocument,
        {
          createEmployeeAbsenceInput: parsedValues,
        },
      );

    return { success: true, data: createEmployeeAbsenceNotice.id };
  } catch (error) {
    console.log(error);
    // Surface the backend rule that rejected the request so the form can map
    // it to a field error (yearly cap, single-day category, per-request max).
    const message =
      (error as { response?: { errors?: { message?: string }[] } })?.response
        ?.errors?.[0]?.message ?? null;
    return { success: false, message };
  }
};
