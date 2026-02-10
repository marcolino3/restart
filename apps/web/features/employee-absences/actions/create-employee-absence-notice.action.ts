"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import {
  EmployeeAbsenceNoticeFormSchema,
  EmployeeAbsenceNoticeFormType,
} from "../schemas/employee-absence-notice-form.schema";
import { graphql } from "@/gql";
import { CreateEmployeeAbsenceNoticeMutation } from "@/gql/graphql";

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

  const parsedValues = EmployeeAbsenceNoticeFormSchema.parse(values);

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
