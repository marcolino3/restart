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

const UpdateAddressDocument = gql`
  mutation UpdateAddress($input: UpdateAddressInput!) {
    updateAddress(input: $input) {
      id
    }
  }
`;

const UpdateContactPersonDocument = gql`
  mutation UpdateContactPerson($input: UpdateContactPersonInput!) {
    updateContactPerson(input: $input) {
      id
    }
  }
`;

export const updateContactPersonAction = async (
  values: ContactPersonFormOutput,
) => {
  const locale = await getLocale();
  const parsed = ContactPersonFormSchema.parse(values);
  const client = await serverCookieGqlClient();

  if (!parsed.id) {
    return { success: false as const, error: "Missing contact person id" };
  }

  let addressId = parsed.addressId ?? null;

  const hasAddressData = Boolean(
    parsed.street || parsed.postalCode || parsed.city,
  );

  if (hasAddressData) {
    const addressInput = {
      ...(parsed.street ? { street: parsed.street } : { street: null }),
      ...(parsed.houseNumber
        ? { houseNumber: parsed.houseNumber }
        : { houseNumber: null }),
      ...(parsed.addressLine2
        ? { addressLine2: parsed.addressLine2 }
        : { addressLine2: null }),
      ...(parsed.postalCode
        ? { postalCode: parsed.postalCode }
        : { postalCode: null }),
      ...(parsed.city ? { city: parsed.city } : { city: null }),
      ...(parsed.state ? { state: parsed.state } : { state: null }),
    };

    try {
      if (addressId) {
        // Update existing address (shared address: changes apply to all)
        await client.request(UpdateAddressDocument, {
          input: { id: addressId, ...addressInput },
        });
      } else {
        // Create new address
        const { createAddress } = await client.request<{
          createAddress: { id: string };
        }>(CreateAddressDocument, { input: addressInput });
        addressId = createAddress.id;
      }
    } catch (error) {
      console.log("Error saving address:", error);
      return { success: false as const, error };
    }
  } else if (addressId) {
    // All address fields cleared → unlink address
    addressId = null;
  }

  const input = {
    id: parsed.id,
    salutation: parsed.salutation || null,
    title: parsed.title || null,
    firstName: parsed.firstName,
    middleName: parsed.middleName || null,
    lastName: parsed.lastName,
    email: parsed.email || null,
    phone: parsed.phone || null,
    mobile: parsed.mobile || null,
    dateOfBirth: parsed.dateOfBirth
      ? parsed.dateOfBirth.toISOString().split("T")[0]
      : null,
    socialSecurityNumber: parsed.socialSecurityNumber || null,
    nationalities: parsed.nationalities,
    preferredLanguages: parsed.preferredLanguages,
    roles: parsed.roles,
    occupation: parsed.occupation || null,
    notes: parsed.notes || null,
    addressId,
  };

  try {
    const { updateContactPerson } = await client.request<{
      updateContactPerson: { id: string };
    }>(UpdateContactPersonDocument, { input });
    revalidatePath(ROUTES.admin.contactPersons(locale));
    revalidatePath(ROUTES.admin.contactPersonsEdit(locale, parsed.id));
    return { success: true as const, data: updateContactPerson };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
