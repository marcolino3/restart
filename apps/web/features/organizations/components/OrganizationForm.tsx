"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { FormActionButtons } from "@/components/form/form-fields/FormActionButtons";
import { CountryComboboxFormField } from "@/components/form/form-fields/CountryComboboxFormField";
import { TimezoneComboboxFormField } from "@/components/form/form-fields/TimezoneComboboxFormField";
import { SwitchFormField } from "@/components/form/form-fields/SwitchFormField";
import { UploadFormField } from "@/components/form/form-fields/UploadFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { CheckboxGroupFormField } from "@/components/form/form-fields/CheckboxGroupFormField";
import { GoogleMapDisplay } from "@/components/google-maps/GoogleMapDisplay";
import { ROUTES } from "@/constants/routes";
import { handleAction } from "@/lib/actions/handle-action";
import { toSlug } from "@/lib/utils/to-slug";
import { sanitizeFormData } from "@/lib/forms/sanitize-form-data";
import { OrganizationQuery } from "@restart/shared-types/graphql";
import { SchoolType } from "@restart/shared-schemas/organizations/organization-enums";

import {
  OrganizationFormSchema,
  OrganizationFormOutput,
} from "../schemas/organization-form.schema";
import { updateOrganizationAction } from "../actions/update-organization.action";
import {
  createOrganizationAction,
  CreateOrganizationParams,
} from "../actions/create-organization.action";
import { checkSubdomainAvailableAction } from "../actions/check-subdomain-available.action";
import { checkDomainAvailableAction } from "../actions/check-domain-available.action";
import { SWISS_CANTONS } from "../constants/swiss-cantons";
import { OrganizationFeaturesTab } from "./OrganizationFeaturesTab";
import { OrganizationSidebar } from "./OrganizationSidebar";

type AvailabilityStatus = "idle" | "checking" | "available" | "taken";

interface FeatureToggle {
  featureKey: string;
  enabled: boolean;
}

interface OrganizationUsage {
  userCount: number;
  childCount: number;
  storageUsedGb: number;
  activeUsersLast30Days: number;
  lastLoginAt?: string | null;
  avgLoginsPerDay: number;
}

interface OrganizationFormProps {
  organization: OrganizationQuery["organization"];
  featureToggles: FeatureToggle[];
  usage?: OrganizationUsage | null;
  /** Create-mode: shows owner fields, hides the sidebar (no org exists yet), submits via createOrganizationAction. */
  isCreate?: boolean;
}

const SCHOOL_LEVELS = ["NIDO", "CASA", "PRIMARIA", "SEKUNDARIA"] as const;

export const OrganizationForm = ({
  organization,
  featureToggles,
  usage = null,
  isCreate = false,
}: OrganizationFormProps) => {
  const t = useTranslations("Common");
  const tO = useTranslations("Organizations");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const subdomainTouchedRef = useRef(!!organization.subdomain);
  const [subdomainStatus, setSubdomainStatus] = useState<AvailabilityStatus>("idle");
  const [domainStatus, setDomainStatus] = useState<AvailabilityStatus>("idle");
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") ?? "general",
  );

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const form = useForm({
    resolver: zodResolver(OrganizationFormSchema),
    defaultValues: OrganizationFormSchema.parse(sanitizeFormData(organization)),
  });

  const checkSubdomain = useCallback(
    async (subdomain: string) => {
      if (!subdomain || subdomain === organization.subdomain) {
        setSubdomainStatus("idle");
        return;
      }
      setSubdomainStatus("checking");
      const available = await checkSubdomainAvailableAction(subdomain);
      setSubdomainStatus(available ? "available" : "taken");
    },
    [organization.subdomain]
  );

  const checkDomain = useCallback(
    async (domain: string) => {
      if (!domain || domain === organization.domain) {
        setDomainStatus("idle");
        return;
      }
      setDomainStatus("checking");
      const available = await checkDomainAvailableAction(domain);
      setDomainStatus(available ? "available" : "taken");
    },
    [organization.domain]
  );

  // eslint-disable-next-line react-hooks/incompatible-library -- React Hook Form returns non-memoizable functions by design
  const nameValue = form.watch("name");
  useEffect(() => {
    if (subdomainTouchedRef.current) return;
    const generated = toSlug(nameValue ?? "");
    form.setValue("subdomain", generated, { shouldValidate: true });
  }, [nameValue, form]);

  const billingAddressSameAsLocation = form.watch("billingAddressSameAsLocation");

  const [ownerFirstName, setOwnerFirstName] = useState("");
  const [ownerLastName, setOwnerLastName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const onSubmit = async (values: Record<string, unknown>) => {
    if (subdomainStatus === "taken") {
      form.setError("subdomain", { message: t("subdomainTaken") });
      return;
    }
    if (domainStatus === "taken") {
      form.setError("domain", { message: t("domainTaken") });
      return;
    }

    if (isCreate) {
      const output = values as OrganizationFormOutput;
      const createValues: CreateOrganizationParams = {
        organizationName: output.name,
        organizationSubdomain: output.subdomain,
        ownerFirstName,
        ownerLastName,
        ownerEmail,
        street: output.street,
        zip: output.zip,
        city: output.city,
        country: output.country,
        phone: output.phone,
        email: output.email,
        website: output.website,
        timezone: output.timezone,
      };

      setIsCreating(true);
      const result = await createOrganizationAction(createValues);
      setIsCreating(false);

      // createOrganizationAction redirects to the edit page on success and
      // never returns in that case (next/navigation throws internally); a
      // returned result here always means failure.
      if (result && !result.success) {
        toast.error(tO("organizationCreateError"), { description: result.error });
      }
      return;
    }

    await handleAction({
      action: () => updateOrganizationAction(values as OrganizationFormOutput),
      successMessage: t("organizationUpdated"),
      errorMessage: t("organizationUpdateError"),
      onSuccess: () => {
        router.push(ROUTES.admin.organizations(locale));
      },
    });
  };

  const renderStatus = (status: AvailabilityStatus, field: "subdomain" | "domain") => {
    if (status === "checking")
      return <p className="text-sm text-muted-foreground mt-1">{t("subdomainChecking")}</p>;
    if (status === "available")
      return <p className="text-sm text-green-600 mt-1">{t(`${field}Available`)}</p>;
    if (status === "taken")
      return <p className="text-sm text-destructive mt-1">{t(`${field}Taken`)}</p>;
    return null;
  };

  const enabledFeatureCount = featureToggles.filter((f) => f.enabled).length;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div
          className={
            isCreate
              ? "w-full"
              : "grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
          }
        >
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="general">{tO("general")}</TabsTrigger>
            <TabsTrigger value="address">{t("address")}</TabsTrigger>
            <TabsTrigger value="contact">{t("contact")}</TabsTrigger>
            {!isCreate && (
              <TabsTrigger value="features" className="gap-2">
                {tO("featuresTitle")}
                <Badge variant="secondary">
                  {enabledFeatureCount} / {featureToggles.length}
                </Badge>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("basicData")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputFormField name="name" label="name" />
                <div>
                  <InputFormField
                    name="subdomain"
                    label="subdomain"
                    onChange={() => {
                      subdomainTouchedRef.current = true;
                    }}
                    onBlur={() =>
                      checkSubdomain(form.getValues("subdomain") as string)
                    }
                  />
                  {renderStatus(subdomainStatus, "subdomain")}
                </div>
                <div>
                  <InputFormField
                    name="domain"
                    label="domain"
                    placeholder="z.B. rietberg-montessori.ch"
                    onBlur={() => checkDomain(form.getValues("domain") as string)}
                  />
                  {renderStatus(domainStatus, "domain")}
                </div>
                <div className="flex gap-4">
                  <InputFormField
                    name="shortCode"
                    label="shortCode"
                    namespace="Organizations"
                    width="w-1/3"
                  />
                  <SelectFormField
                    name="schoolType"
                    label="schoolType"
                    namespace="Organizations"
                    width="w-2/3"
                    options={Object.values(SchoolType).map((value) => ({
                      value,
                      label: `schoolType_${value}`,
                    }))}
                  />
                </div>
                <InputFormField
                  name="legalEntity"
                  label="legalEntity"
                  namespace="Organizations"
                />
                <SwitchFormField name="isActive" label="isActive" />
              </CardContent>
            </Card>

            {isCreate && (
              <Card>
                <CardHeader>
                  <CardTitle>{tO("createOwnerPanel")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-1/2 space-y-2">
                      <Label htmlFor="ownerFirstName">{tO("ownerFirstName")}</Label>
                      <Input
                        id="ownerFirstName"
                        value={ownerFirstName}
                        onChange={(e) => setOwnerFirstName(e.target.value)}
                      />
                    </div>
                    <div className="w-1/2 space-y-2">
                      <Label htmlFor="ownerLastName">{tO("ownerLastName")}</Label>
                      <Input
                        id="ownerLastName"
                        value={ownerLastName}
                        onChange={(e) => setOwnerLastName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerEmail">{tO("ownerEmail")}</Label>
                    <Input
                      id="ownerEmail"
                      type="email"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>{t("settings")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <TimezoneComboboxFormField name="timezone" />
                <InputFormField
                  name="language"
                  label="language"
                  namespace="Organizations"
                />
                <Separator />
                <UploadFormField
                  name="logoUrl"
                  label="logo"
                  namespace="Organizations"
                  entity="organizations"
                  id={organization.id}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{tO("schoolYearPanel")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputFormField
                  name="currentSchoolYear"
                  label="currentSchoolYear"
                  namespace="Organizations"
                />
                <CheckboxGroupFormField
                  name="activeLevels"
                  label="activeLevels"
                  namespace="Organizations"
                  options={SCHOOL_LEVELS.map((level) => ({
                    value: level,
                    label: `level_${level}`,
                  }))}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="address" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("address")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputFormField name="street" label="street" />
                <div className="flex gap-4">
                  <InputFormField name="zip" label="zip" width="w-1/3" />
                  <InputFormField name="city" label="city" width="w-2/3" />
                </div>
                <div className="flex gap-4">
                  <SelectFormField
                    name="state"
                    label="state"
                    namespace="Organizations"
                    width="w-1/2"
                    translateOptions={false}
                    options={SWISS_CANTONS.map((canton) => ({
                      value: canton.value,
                      label: canton.label,
                    }))}
                  />
                  <CountryComboboxFormField name="country" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{tO("billingAddressPanel")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <SwitchFormField
                  name="billingAddressSameAsLocation"
                  label="billingAddressSameAsLocation"
                  namespace="Organizations"
                />
                {!billingAddressSameAsLocation && (
                  <InputFormField
                    name="billingAddressExtra"
                    label="billingAddressExtra"
                    namespace="Organizations"
                  />
                )}
              </CardContent>
            </Card>

            {organization.latitude != null && organization.longitude != null && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("location")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <GoogleMapDisplay
                    latitude={organization.latitude}
                    longitude={organization.longitude}
                    className="h-[300px] w-full rounded-md"
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{tO("contactPanel")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputFormField
                  name="contactName"
                  label="contactName"
                  namespace="Organizations"
                />
                <InputFormField
                  name="contactRole"
                  label="contactRole"
                  namespace="Organizations"
                />
                <InputFormField
                  name="contactEmail"
                  label="contactEmail"
                  namespace="Organizations"
                  type="email"
                />
                <InputFormField
                  name="contactPhone"
                  label="contactPhone"
                  namespace="Organizations"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("contact")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputFormField name="phone" label="phone" />
                <InputFormField name="email" label="email" type="email" />
                <InputFormField name="website" label="website" />
                <InputFormField
                  name="billingEmail"
                  label="billingEmail"
                  namespace="Organizations"
                  type="email"
                />
                <InputFormField
                  name="parentMailSenderEmail"
                  label="parentMailSenderEmail"
                  namespace="Organizations"
                  type="email"
                  description="parentMailSenderEmailHelp"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {!isCreate && (
            <TabsContent value="features" className="space-y-6">
              <OrganizationFeaturesTab
                organizationId={organization.id}
                toggles={featureToggles}
              />
            </TabsContent>
          )}
          </Tabs>

          {!isCreate && (
            <OrganizationSidebar organization={organization} usage={usage} />
          )}
        </div>

        <FormActionButtons
          disabled={form.formState.isSubmitting || isCreating}
          onCancel={() => {
            router.push(ROUTES.admin.organizations(locale));
          }}
        />
      </form>
    </Form>
  );
};
