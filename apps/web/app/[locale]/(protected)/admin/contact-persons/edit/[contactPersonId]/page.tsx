import { getContactPersonByIdAction } from "@/features/contact-persons/actions/get-contact-person-by-id.action";
import { getRelatedAddressesAction } from "@/features/contact-persons/actions/get-related-addresses.action";
import { getAddressSharingInfoAction } from "@/features/contact-persons/actions/get-address-sharing-info.action";
import { getActiveOrganizationAction } from "@/features/organizations/actions/get-active-organization.action";
import ContactPersonForm from "@/features/contact-persons/components/ContactPersonForm";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ contactPersonId: string }>;
}

const EditContactPersonPage = async ({ params }: Props) => {
  const { contactPersonId } = await params;
  const t = await getTranslations("ContactPersons");

  const [contactPersonResult, suggestionsResult, orgResult] = await Promise.all([
    getContactPersonByIdAction(contactPersonId),
    getRelatedAddressesAction(contactPersonId),
    getActiveOrganizationAction(),
  ]);

  if (!contactPersonResult.success || !contactPersonResult.data) {
    notFound();
  }

  const data = contactPersonResult.data;
  const suggestions = suggestionsResult.data ?? [];
  const orgCountry = orgResult.success ? (orgResult.data?.country ?? null) : null;

  // Fetch sharing info if contact person has an address
  const sharingWith = data.addressId
    ? (await getAddressSharingInfoAction(data.addressId, contactPersonId))
        .data ?? []
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        {t("editContactPerson")} &ndash; {data.firstName} {data.lastName}
      </h1>
      <ContactPersonForm
        contactPerson={data}
        addressSuggestions={suggestions}
        sharingWith={sharingWith}
        orgCountry={orgCountry}
      />
    </div>
  );
};

export default EditContactPersonPage;
