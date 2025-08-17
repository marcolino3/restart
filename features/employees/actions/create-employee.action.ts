"use server";

import { graphql } from "@/gql";
import {
  CreateEmployeeFormSchema,
  CreateEmployeeFormType,
} from "../schemas/create-employee-form.schema";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { CreateEmployeeMutation } from "@/gql/graphql";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/constants/routes";
import { getLocale } from "next-intl/server";

const CreateEmployeeDocument = graphql(`
  mutation CreateEmployee($createEmployeeInput: CreateEmployeeInput!) {
    createEmployee(createEmployeeInput: $createEmployeeInput) {
      id
    }
  }
`);

export const createEmployeeAction = async (values: CreateEmployeeFormType) => {
  const locale = await getLocale();
  const parsedValues = CreateEmployeeFormSchema.parse(values);
  const client = await serverCookieGqlClient();

  try {
    const { createEmployee }: CreateEmployeeMutation = await client.request(
      CreateEmployeeDocument,
      {
        createEmployeeInput: parsedValues,
      }
    );
    revalidatePath(ROUTES.admin.employees(locale));
    return { success: true, data: createEmployee };
  } catch (error) {
    console.log(error);
  }
};
