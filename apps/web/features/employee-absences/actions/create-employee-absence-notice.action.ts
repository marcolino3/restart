"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import {
  EmployeeAbsenceNoticeFormSchema,
  EmployeeAbsenceNoticeFormType,
} from "../schemas/employee-absence-notice-form.schema";
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
  values: EmployeeAbsenceNoticeFormType
) => {
  const client = await serverCookieGqlClient();

  const parsed = EmployeeAbsenceNoticeFormSchema.parse(values);
  // The backend validates ISO date strings, so Date objects are serialized here
  // instead of relying on implicit JSON conversion.
  const parsedValues = {
    ...parsed,
    startDate: parsed.startDate.toISOString(),
    endDate: parsed.endDate ? parsed.endDate.toISOString() : null,
  };

  try {
    const { createEmployeeAbsenceNotice } =
      await client.request<CreateEmployeeAbsenceNoticeMutation>(
        CreateEmployeeAbsenceNoticeDocument,
        {
          createEmployeeAbsenceInput: parsedValues,
        }
      );

    return { success: true, data: createEmployeeAbsenceNotice.id };
  } catch (error) {
    console.log(error);
    return { success: false };
  }
};
