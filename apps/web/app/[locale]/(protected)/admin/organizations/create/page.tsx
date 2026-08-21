import { OrganizationForm } from "@/features/organizations/components/OrganizationForm";
import { OrganizationQuery } from "@restart/shared-types/graphql";

// Placeholder satisfying the OrganizationForm props shape before the
// organization actually exists — createOrganizationAction never reads back
// this id, it only carries the zod schema's required `id: uuid()` shape.
const EMPTY_ORGANIZATION: OrganizationQuery["organization"] = {
  id: "00000000-0000-0000-0000-000000000000",
  name: "",
  subdomain: "",
  domain: null,
  street: null,
  zip: null,
  city: null,
  country: null,
  phone: null,
  email: null,
  website: null,
  timezone: "Europe/Berlin",
  latitude: null,
  longitude: null,
  isActive: true,
  shortCode: null,
  sponsorship: null,
  schoolType: null,
  careModel: null,
  legalEntity: null,
  language: "de-CH",
  logoUrl: null,
  billingAddressSameAsLocation: true,
  billingAddressExtra: null,
  contactSalutation: null,
  contactTitle: null,
  contactFirstName: null,
  contactLastName: null,
  contactRole: null,
  contactEmail: null,
  contactPhone: null,
  billingEmail: null,
  parentMailSenderEmail: null,
  currentSchoolYear: null,
  activeLevels: [],
  plan: "STARTER",
  userLicenseLimit: null,
  contractEndsAt: null,
  billingInterval: "YEARLY",
  billingAmountChf: null,
  storageLimitGb: null,
  lifecycleStatus: "ACTIVE",
  trialEndsAt: null,
  suspendedReason: null,
  bvgProvider: null,
  bvgContactPhone: null,
  uvgProvider: null,
  uvgContactPhone: null,
  dailySicknessProvider: null,
  dailySicknessContactPhone: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const CreateOrganizationPage = () => (
  <OrganizationForm
    organization={EMPTY_ORGANIZATION}
    featureToggles={[]}
    isCreate
  />
);

export default CreateOrganizationPage;
