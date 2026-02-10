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
import { UploadFormField } from "@/components/form/form-fields/UploadFormField";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { checkSlugAvailableAction } from "../actions/check-slug-available.action";

interface OrganizationFormProps {
  organization: OrganizationQuery["organization"];
}

export const OrganizationForm = ({ organization }: OrganizationFormProps) => {
  const t = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const slugTouchedRef = useRef(!!organization.slug);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");

  const form = useForm({
    resolver: zodResolver(OrganizationFormSchema),
    defaultValues: OrganizationFormSchema.parse(sanitizeFormData(organization)),
  });

  const checkSlug = useCallback(
    (slug: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!slug) {
        setSlugStatus("idle");
        return;
      }
      if (slug === organization.slug) {
        setSlugStatus("idle");
        return;
      }
      setSlugStatus("checking");
      debounceRef.current = setTimeout(async () => {
        const available = await checkSlugAvailableAction(slug);
        setSlugStatus(available ? "available" : "taken");
      }, 400);
    },
    [organization.slug]
  );

  const nameValue = form.watch("name");
  useEffect(() => {
    if (slugTouchedRef.current) return;
    const generated = toSlug(nameValue ?? "");
    form.setValue("slug", generated, { shouldValidate: true });
    checkSlug(generated);
  }, [nameValue, form, checkSlug]);

  const onSubmit = async (values: Record<string, unknown>) => {
    if (slugStatus === "taken") {
      form.setError("slug", {
        message: t("slugTaken"),
      });
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
                name="slug"
                label="slug"
                onChange={() => {
                  slugTouchedRef.current = true;
                  const val = form.getValues("slug") as string;
                  checkSlug(val);
                }}
              />
              {slugStatus === "checking" && (
                <p className="text-sm text-muted-foreground mt-1">
                  {t("slugChecking")}
                </p>
              )}
              {slugStatus === "available" && (
                <p className="text-sm text-green-600 mt-1">
                  {t("slugAvailable")}
                </p>
              )}
              {slugStatus === "taken" && (
                <p className="text-sm text-destructive mt-1">
                  {t("slugTaken")}
                </p>
              )}
            </div>
            <InputFormField name="domain" label="domain" placeholder="z.B. rietberg-montessori.ch" />
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
