"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Form } from "@/components/ui/form";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { FormActionButtons } from "@/components/form/form-fields/FormActionButtons";
import { CountryComboboxFormField } from "@/components/form/form-fields/CountryComboboxFormField";
import { TimezoneComboboxFormField } from "@/components/form/form-fields/TimezoneComboboxFormField";
import { SwitchFormField } from "@/components/form/form-fields/SwitchFormField";
import { UploadFormField } from "@/components/form/form-fields/UploadFormField";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleMapDisplay } from "@/components/google-maps/GoogleMapDisplay";
import { ROUTES } from "@/constants/routes";
import { handleAction } from "@/lib/actions/handle-action";
import { toSlug } from "@/lib/utils/to-slug";
import { sanitizeFormData } from "@/lib/forms/sanitize-form-data";
import { OrganizationQuery } from "@/gql/graphql";

import {
  OrganizationFormSchema,
  OrganizationFormOutput,
} from "../schemas/organization-form.schema";
import { updateOrganizationAction } from "../actions/update-organization.action";
import { checkSubdomainAvailableAction } from "../actions/check-subdomain-available.action";
import { checkDomainAvailableAction } from "../actions/check-domain-available.action";

type AvailabilityStatus = "idle" | "checking" | "available" | "taken";

interface OrganizationFormProps {
  organization: OrganizationQuery["organization"];
}

export const OrganizationForm = ({ organization }: OrganizationFormProps) => {
  const t = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const subdomainTouchedRef = useRef(!!organization.subdomain);
  const [subdomainStatus, setSubdomainStatus] = useState<AvailabilityStatus>("idle");
  const [domainStatus, setDomainStatus] = useState<AvailabilityStatus>("idle");

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

  const nameValue = form.watch("name");
  useEffect(() => {
    if (subdomainTouchedRef.current) return;
    const generated = toSlug(nameValue ?? "");
    form.setValue("subdomain", generated, { shouldValidate: true });
  }, [nameValue, form]);

  const onSubmit = async (values: Record<string, unknown>) => {
    if (subdomainStatus === "taken") {
      form.setError("subdomain", { message: t("subdomainTaken") });
      return;
    }
    if (domainStatus === "taken") {
      form.setError("domain", { message: t("domainTaken") });
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Grunddaten */}
        <Card>
          <CardHeader>
            <CardTitle>{t("basicData")}</CardTitle>
          </CardHeader>
          <CardContent className="form-gap-y">
            <InputFormField name="name" label="name" />
            <div>
              <InputFormField
                name="subdomain"
                label="subdomain"
                onChange={() => {
                  subdomainTouchedRef.current = true;
                }}
                onBlur={() => checkSubdomain(form.getValues("subdomain") as string)}
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
          </CardContent>
        </Card>

        {/* Adresse */}
        <Card>
          <CardHeader>
            <CardTitle>{t("address")}</CardTitle>
          </CardHeader>
          <CardContent className="form-gap-y">
            <InputFormField name="street" label="street" />
            <div className="flex gap-4">
              <InputFormField name="zip" label="zip" width="w-1/3" />
              <InputFormField name="city" label="city" width="w-2/3" />
            </div>
            <CountryComboboxFormField name="country" />
          </CardContent>
        </Card>

        {/* Standort / Karte */}
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

        {/* Kontakt */}
        <Card>
          <CardHeader>
            <CardTitle>{t("contact")}</CardTitle>
          </CardHeader>
          <CardContent className="form-gap-y">
            <InputFormField name="phone" label="phone" />
            <InputFormField name="email" label="email" type="email" />
            <InputFormField name="website" label="website" />
          </CardContent>
        </Card>

        {/* Einstellungen */}
        <Card>
          <CardHeader>
            <CardTitle>{t("settings")}</CardTitle>
          </CardHeader>
          <CardContent className="form-gap-y">
            <TimezoneComboboxFormField name="timezone" />
          </CardContent>
        </Card>

        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle>{t("logo")}</CardTitle>
          </CardHeader>
          <CardContent>
            <UploadFormField
              name="logo"
              label="logo"
              entity="organizations"
              id={organization.id}
            />
          </CardContent>
        </Card>

        <SwitchFormField name="isActive" label="isActive" />

        <FormActionButtons
          disabled={form.formState.isSubmitting}
          onCancel={() => {
            router.push(ROUTES.admin.organizations(locale));
          }}
        />
      </form>
    </Form>
  );
};
