"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2, MapPin } from "lucide-react";

import { Form, FormField, FormControl, FormItem } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHead } from "@/components/common/PageHead";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { CountryComboboxFormField } from "@/components/form/form-fields/CountryComboboxFormField";
import { TimezoneComboboxFormField } from "@/components/form/form-fields/TimezoneComboboxFormField";
import { SwitchFormField } from "@/components/form/form-fields/SwitchFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { GoogleMapDisplay } from "@/components/google-maps/GoogleMapDisplay";
import { ROUTES } from "@/constants/routes";
import { handleAction } from "@/lib/actions/handle-action";
import { toSlug } from "@/lib/utils/to-slug";
import { sanitizeFormData } from "@/lib/forms/sanitize-form-data";
import { cn } from "@/lib/utils";
import { OrganizationQuery } from "@restart/shared-types/graphql";
import {
  SchoolType,
  OrgLifecycleStatus,
} from "@restart/shared-schemas/organizations/organization-enums";

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

  const lifecycleStatus = organization.lifecycleStatus ?? OrgLifecycleStatus.ACTIVE;
  const isSubmitDisabled = form.formState.isSubmitting || isCreating;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {!isCreate && (
          <Link
            href={ROUTES.admin.organizations(locale)}
            className="mb-[3px] inline-block text-[12.5px] font-[550] text-muted-foreground hover:text-accent-foreground"
          >
            &lsaquo; {tO("backToOrganizations")}
          </Link>
        )}

        <PageHead
          title={organization.name}
          stacked
          subtitle={
            !isCreate && (
              <span className="flex items-center gap-2">
                {organization.shortCode}
                {" · "}
                {tO(
                  `plan_${organization.plan}` as `plan_${NonNullable<
                    typeof organization.plan
                  >}`
                )}
                <Badge
                  variant={
                    lifecycleStatus === OrgLifecycleStatus.SUSPENDED
                      ? "rose"
                      : lifecycleStatus === OrgLifecycleStatus.TRIAL
                        ? "amber"
                        : "green"
                  }
                >
                  {tO(`lifecycle_${lifecycleStatus}`)}
                </Badge>
              </span>
            )
          }
          action={
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(ROUTES.admin.organizations(locale))}
                disabled={isSubmitDisabled}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitDisabled}>
                {isSubmitDisabled && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("save")}
              </Button>
            </div>
          }
        />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="general">{tO("general")}</TabsTrigger>
            <TabsTrigger value="address">{t("address")}</TabsTrigger>
            <TabsTrigger value="contact">{t("contact")}</TabsTrigger>
            {!isCreate && (
              <TabsTrigger value="features">{tO("featuresTitle")}</TabsTrigger>
            )}
          </TabsList>

          <div
            className={
              isCreate
                ? "w-full"
                : "grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
            }
          >
          <div className="min-w-0">
          <TabsContent value="general" className="mt-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("basicData")}</CardTitle>
                <CardDescription>{tO("basicDataDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-[18px]">
                <div className="grid grid-cols-2 gap-4">
                  <InputFormField name="name" label="name" />
                  <InputFormField
                    name="shortCode"
                    label="shortCode"
                    namespace="Organizations"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <SelectFormField
                    name="schoolType"
                    label="schoolType"
                    namespace="Organizations"
                    options={Object.values(SchoolType).map((value) => ({
                      value,
                      label: `schoolType_${value}`,
                    }))}
                  />
                  <InputFormField
                    name="legalEntity"
                    label="legalEntity"
                    namespace="Organizations"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputFormField
                    name="language"
                    label="language"
                    namespace="Organizations"
                  />
                  <TimezoneComboboxFormField name="timezone" />
                </div>
                <Separator />
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
                <SwitchFormField name="isActive" label="isActive" />
              </CardContent>
            </Card>

            {isCreate && (
              <Card>
                <CardHeader>
                  <CardTitle>{tO("createOwnerPanel")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-[18px]">
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

          </TabsContent>

          <TabsContent value="address" className="mt-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("address")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-[18px]">
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
              <CardContent className="space-y-[14px]">
                <div
                  className={cn(
                    "flex items-center gap-[10px] rounded-lg border px-[14px] py-[13px]",
                    billingAddressSameAsLocation &&
                      "border-[color-mix(in_oklab,var(--acc)_32%,var(--line))] bg-[color-mix(in_oklab,var(--acc)_4%,var(--panel))]"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-muted text-muted-foreground",
                      billingAddressSameAsLocation && "bg-accent text-accent-foreground"
                    )}
                  >
                    <MapPin className="h-[15px] w-[15px]" />
                  </span>
                  <div className="flex-1">
                    <p className="text-[13.5px] font-semibold">
                      {tO("billingAddressSameAsLocation")}
                    </p>
                    <p className="text-[11.5px] font-normal text-muted-foreground">
                      {tO("billingAddressSameAsLocationHint")}
                    </p>
                  </div>
                  <FormField
                    name="billingAddressSameAsLocation"
                    render={({ field }) => (
                      <FormItem className="m-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            aria-label={tO("billingAddressSameAsLocation")}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <InputFormField
                  name="billingAddressExtra"
                  label="billingAddressExtra"
                  namespace="Organizations"
                />
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

          <TabsContent value="contact" className="mt-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{tO("contactPanel")}</CardTitle>
                <CardDescription>{tO("contactPanelHint")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-[18px]">
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{tO("contactChannelsPanel")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-[18px]">
                <div className="grid grid-cols-2 gap-4">
                  <InputFormField name="website" label="website" />
                  <InputFormField
                    name="billingEmail"
                    label="billingEmail"
                    namespace="Organizations"
                    type="email"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {!isCreate && (
            <TabsContent value="features" className="mt-0 space-y-6">
              <OrganizationFeaturesTab
                organizationId={organization.id}
                toggles={featureToggles}
              />
            </TabsContent>
          )}
          </div>

          {!isCreate && (
            <OrganizationSidebar organization={organization} usage={usage} />
          )}
          </div>
        </Tabs>
      </form>
    </Form>
  );
};
