"use server";

import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { ROUTES } from "@/constants/routes";
import {
  ConsentPurposeFormSchema,
  type ConsentPurposeFormType,
} from "../schemas/consent-purpose-form.schema";

const CreateConsentPurposeDocument = gql`
  mutation CreateConsentPurpose($input: CreateConsentPurposeInput!) {
    createConsentPurpose(input: $input) {
      id
    }
  }
`;

const UpdateConsentPurposeDocument = gql`
  mutation UpdateConsentPurpose($input: UpdateConsentPurposeInput!) {
    updateConsentPurpose(input: $input) {
      id
    }
  }
`;

type SaveResponse = {
  createConsentPurpose?: { id: string };
  updateConsentPurpose?: { id: string };
};

/**
 * Creates or updates an org consent purpose. Presence of `id` decides which
 * mutation runs; validation mirrors the backend DTO.
 */
export const saveConsentPurposeAction = async (
  values: ConsentPurposeFormType,
) => {
  const locale = await getLocale();
  const parsed = ConsentPurposeFormSchema.parse(values);
  const client = await serverCookieGqlClient();

  const base = {
    name: parsed.name,
    slug: parsed.slug,
    appliesTo: parsed.appliesTo,
    legalBasis: parsed.legalBasis,
    requiresEvidence: parsed.requiresEvidence,
    isMandatory: parsed.isMandatory,
    ...(parsed.description ? { description: parsed.description } : {}),
  };

  try {
    if (parsed.id) {
      const { updateConsentPurpose } = await client.request<SaveResponse>(
        UpdateConsentPurposeDocument,
        { input: { id: parsed.id, ...base } },
      );
      revalidatePath(ROUTES.admin.dataProtection(locale));
      return { success: true as const, data: updateConsentPurpose! };
    }

    const { createConsentPurpose } = await client.request<SaveResponse>(
      CreateConsentPurposeDocument,
      { input: base },
    );
    revalidatePath(ROUTES.admin.dataProtection(locale));
    return { success: true as const, data: createConsentPurpose! };
  } catch (error) {
    const message =
      (error as { response?: { errors?: { message?: string }[] } })?.response
        ?.errors?.[0]?.message ?? "Unknown error";
    return { success: false as const, error: message };
  }
};
