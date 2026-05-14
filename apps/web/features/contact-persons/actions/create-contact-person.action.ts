"use server";

import {
  ContactPersonFormSchema,
  ContactPersonFormOutput,
} from "../schemas/contact-person-form.schema";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/constants/routes";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";

const CreateAddressDocument = gql`
  mutation CreateAddress($input: CreateAddressInput!) {
    createAddress(input: $input) {
      id
    }
  }
`;

const CreateContactPersonDocument = gql`
  mutation CreateContactPerson($input: CreateContactPersonInput!) {
    createContactPerson(input: $input) {
      id
    }
  }
`;

export const createContactPersonAction = async (
  values: ContactPersonFormOutput,
) => {
  const locale = await getLocale();
  const parsed = ContactPersonFormSchema.parse(values);
  const client = await serverCookieGqlClient();

  let addressId = parsed.addressId ?? null;

  // Create new address if address fields are filled but no addressId (not sharing)
  const hasAddressData = Boolean(
    parsed.street || parsed.postalCode || parsed.city,
  );
  if (hasAddressData && !addressId) {
    try {
      const addressInput = {
        ...(parsed.street ? { street: parsed.street } : {}),
        ...(parsed.houseNumber ? { houseNumber: parsed.houseNumber } : {}),
        ...(parsed.addressLine2
          ? { addressLine2: parsed.addressLine2 }
          : {}),
        ...(parsed.postalCode ? { postalCode: parsed.postalCode } : {}),
        ...(parsed.city ? { city: parsed.city } : {}),
        ...(parsed.state ? { state: parsed.state } : {}),
      };
      const { createAddress } = await client.request<{
        createAddress: { id: string };
      }>(CreateAddressDocument, { input: addressInput });
      addressId = createAddress.id;
    } catch (error) {
      console.log("Error creating address:", error);
      return { success: false as const, error };
    }
  }

  const input = {
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    ...(parsed.salutation ? { salutation: parsed.salutation } : {}),
    ...(parsed.title ? { title: parsed.title } : {}),
    ...(parsed.middleName ? { middleName: parsed.middleName } : {}),
    ...(parsed.email ? { email: parsed.email } : {}),
    ...(parsed.phone ? { phone: parsed.phone } : {}),
    ...(parsed.mobile ? { mobile: parsed.mobile } : {}),
    ...(parsed.dateOfBirth
      ? { dateOfBirth: parsed.dateOfBirth.toISOString().split("T")[0] }
      : {}),
    ...(parsed.socialSecurityNumber
      ? { socialSecurityNumber: parsed.socialSecurityNumber }
      : {}),
    nationalities: parsed.nationalities,
    preferredLanguages: parsed.preferredLanguages,
    roles: parsed.roles,
    ...(parsed.occupation ? { occupation: parsed.occupation } : {}),
    ...(parsed.notes ? { notes: parsed.notes } : {}),
    ...(addressId ? { addressId } : {}),
  };

  try {
    const { createContactPerson } = await client.request<{
      createContactPerson: { id: string };
    }>(CreateContactPersonDocument, { input });
    revalidatePath(ROUTES.admin.contactPersons(locale));
    return { success: true as const, data: createContactPerson };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
