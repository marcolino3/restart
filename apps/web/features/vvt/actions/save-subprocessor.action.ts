"use server";

import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { ROUTES } from "@/constants/routes";
import {
  SubprocessorFormSchema,
  type SubprocessorFormType,
} from "../schemas/vvt-form.schema";

const CreateDoc = gql`
  mutation CreateSubprocessor($input: CreateSubprocessorInput!) {
    createSubprocessor(input: $input) {
      id
    }
  }
`;
const UpdateDoc = gql`
  mutation UpdateSubprocessor($input: UpdateSubprocessorInput!) {
    updateSubprocessor(input: $input) {
      id
    }
  }
`;

export const saveSubprocessorAction = async (
  values: SubprocessorFormType,
  id?: string,
) => {
  const locale = await getLocale();
  const parsed = SubprocessorFormSchema.parse(values);
  const client = await serverCookieGqlClient();

  const input = {
    name: parsed.name,
    dpaSigned: parsed.dpaSigned,
    ...(parsed.purpose ? { purpose: parsed.purpose } : {}),
    ...(parsed.country ? { country: parsed.country } : {}),
    ...(parsed.url ? { url: parsed.url } : {}),
    ...(parsed.notes ? { notes: parsed.notes } : {}),
  };

  try {
    if (id) {
      await client.request(UpdateDoc, { input: { id, ...input } });
    } else {
      await client.request(CreateDoc, { input });
    }
    revalidatePath(ROUTES.admin.dataProtection(locale));
    return { success: true as const, data: null };
  } catch (error) {
    const message =
      (error as { response?: { errors?: { message?: string }[] } })?.response
        ?.errors?.[0]?.message ?? "Unknown error";
    return { success: false as const, error: message };
  }
};
