"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useCallback } from "react";
import { Info, Link2, Unlink } from "lucide-react";

import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { ComboboxFormField } from "@/components/form/form-fields/ComboboxFormField";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { CountryComboboxFormField } from "@/components/form/form-fields/CountryComboboxFormField";
import { FormActionButtons } from "@/components/form/form-fields/FormActionButtons";
import { ROUTES } from "@/constants/routes";
import { handleAction } from "@/lib/actions/handle-action";

import {
  ContactPersonFormSchema,
  ContactPersonFormOutput,
  LANGUAGE_CODES,
  RELATIONSHIP_TYPES,
  SALUTATIONS,
} from "../schemas/contact-person-form.schema";
import { createContactPersonAction } from "../actions/create-contact-person.action";
import { updateContactPersonAction } from "../actions/update-contact-person.action";
import { ContactPersonDetail } from "../actions/get-contact-person-by-id.action";
import type { AddressSuggestion } from "../actions/get-related-addresses.action";
import type { SharingContactPerson } from "../actions/get-address-sharing-info.action";

const NATIONALITY_CODES = [
  "DE", "AT", "CH", "BE", "BG", "DK", "EE", "FI", "FR", "GR",
  "IE", "IT", "HR", "LV", "LT", "LU", "MT", "NL", "PL", "PT",
  "RO", "SE", "SK", "SI", "ES", "CZ", "HU", "CY", "NO", "IS",
  "LI", "GB", "US", "CA", "AU", "TR", "JP", "CN", "IN", "BR",
] as const;

interface Props {
  contactPerson?: ContactPersonDetail;
  addressSuggestions?: AddressSuggestion[];
  sharingWith?: SharingContactPerson[];
}

export default function ContactPersonForm({
  contactPerson,
  addressSuggestions = [],
  sharingWith = [],
}: Props) {
  const tC = useTranslations("ContactPersons");
  const tCountries = useTranslations("Countries");
  const tLanguages = useTranslations("Languages");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const isEdit = Boolean(contactPerson);

  const salutationOptions = useMemo(
    () => SALUTATIONS.map((s) => ({ label: s, value: s })),
    [],
  );

  const roleOptions = useMemo(
    () =>
      RELATIONSHIP_TYPES.map((r) => ({ label: tC(r), value: r })).sort(
        (a, b) => a.label.localeCompare(b.label),
      ),
    [tC],
  );

  const nationalityOptions = useMemo(
    () =>
      NATIONALITY_CODES.map((code) => ({
        label: tCountries(code),
        value: code,
      })).sort((a, b) => a.label.localeCompare(b.label)),
    [tCountries],
  );

  const languageOptions = useMemo(
    () =>
      LANGUAGE_CODES.map((code) => ({
        label: tLanguages(code),
        value: code,
      })).sort((a, b) => a.label.localeCompare(b.label)),
    [tLanguages],
  );

  const form = useForm({
    resolver: zodResolver(ContactPersonFormSchema),
    defaultValues: {
      id: contactPerson?.id,
      salutation: contactPerson?.salutation ?? "",
      title: contactPerson?.title ?? "",
      firstName: contactPerson?.firstName ?? "",
      middleName: contactPerson?.middleName ?? "",
      lastName: contactPerson?.lastName ?? "",
      email: contactPerson?.email ?? "",
      phone: contactPerson?.phone ?? "",
      mobile: contactPerson?.mobile ?? "",
      dateOfBirth: contactPerson?.dateOfBirth
        ? new Date(contactPerson.dateOfBirth)
        : null,
      socialSecurityNumber: contactPerson?.socialSecurityNumber ?? "",
      nationalities: contactPerson?.nationalities ?? [],
      preferredLanguages: contactPerson?.preferredLanguages ?? [],
      roles: contactPerson?.roles ?? [],
      occupation: contactPerson?.occupation ?? "",
      notes: contactPerson?.notes ?? "",
      addressId: contactPerson?.addressId ?? null,
      street: contactPerson?.address?.street ?? "",
      houseNumber: contactPerson?.address?.houseNumber ?? "",
      addressLine2: contactPerson?.address?.addressLine2 ?? "",
      postalCode: contactPerson?.address?.postalCode ?? "",
      city: contactPerson?.address?.city ?? "",
      state: contactPerson?.address?.state ?? "",
      country: contactPerson?.address?.country?.isoCode ?? "",
    },
  });

  const currentAddressId = form.watch("addressId");
  const isSharedAddress = sharingWith.length > 0 && Boolean(currentAddressId);

  const applySuggestion = useCallback(
    (suggestion: AddressSuggestion) => {
      const addr = suggestion.address;
      form.setValue("addressId", addr.id);
      form.setValue("street", addr.street ?? "");
      form.setValue("houseNumber", addr.houseNumber ?? "");
      form.setValue("addressLine2", addr.addressLine2 ?? "");
      form.setValue("postalCode", addr.postalCode ?? "");
      form.setValue("city", addr.city ?? "");
      form.setValue("state", addr.state ?? "");
      form.setValue("country", addr.country?.isoCode ?? "");
    },
    [form],
  );

  const unlinkAddress = useCallback(() => {
    form.setValue("addressId", null);
  }, [form]);

  const clearAddress = useCallback(() => {
    form.setValue("addressId", null);
    form.setValue("street", "");
    form.setValue("houseNumber", "");
    form.setValue("addressLine2", "");
    form.setValue("postalCode", "");
    form.setValue("city", "");
    form.setValue("state", "");
    form.setValue("country", "");
  }, [form]);

  const onSubmit = async (values: Record<string, unknown>) => {
    await handleAction({
      action: () =>
        isEdit
          ? updateContactPersonAction(values as ContactPersonFormOutput)
          : createContactPersonAction(values as ContactPersonFormOutput),
      successMessage: isEdit
        ? tC("contactPersonUpdated")
        : tC("contactPersonCreated"),
      errorMessage: isEdit
        ? tC("contactPersonUpdateError")
        : tC("contactPersonCreateError"),
      onSuccess: () => {
        router.push(ROUTES.admin.contactPersons(locale));
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">{tC("personSection")}</h3>
          <div className="grid grid-cols-4 gap-4">
            <SelectFormField
              name="salutation"
              label="salutation"
              placeholder="selectPlaceholder"
              options={salutationOptions}
            />
            <InputFormField name="title" label="title" />
            <InputFormField name="firstName" label="firstName" />
            <InputFormField name="lastName" label="lastName" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputFormField name="middleName" label="middleName" />
            <DatePickerFormField name="dateOfBirth" label="dateOfBirth" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputFormField
              name="socialSecurityNumber"
              label="socialSecurityNumber"
            />
            <InputFormField name="occupation" label="occupation" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ComboboxFormField
              name="nationalities"
              label="nationalities"
              options={nationalityOptions}
              multiple
              translateOptions={false}
            />
            <ComboboxFormField
              name="preferredLanguages"
              label="preferredLanguages"
              options={languageOptions}
              multiple
              translateOptions={false}
            />
          </div>
          <ComboboxFormField
            name="roles"
            label="roles"
            options={roleOptions}
            multiple
            translateOptions={false}
          />
        </section>

        <Separator />

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">{tC("contactSection")}</h3>
          <InputFormField name="email" label="email" type="email" />
          <div className="grid grid-cols-2 gap-4">
            <InputFormField name="phone" label="phone" />
            <InputFormField name="mobile" label="mobile" />
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">
            {tC("addressSection")}
          </h3>

          {/* Address suggestions (only when no address is set) */}
          {!currentAddressId && addressSuggestions.length > 0 && (
            <Alert>
              <Link2 className="h-4 w-4" />
              <AlertTitle>{tC("suggestAddress")}</AlertTitle>
              <AlertDescription>
                <div className="mt-2 flex flex-col gap-2">
                  {addressSuggestions.map((suggestion) => {
                    const addr = suggestion.address;
                    const addrText = [
                      [addr.street, addr.houseNumber]
                        .filter(Boolean)
                        .join(" "),
                      [addr.postalCode, addr.city].filter(Boolean).join(" "),
                    ]
                      .filter(Boolean)
                      .join(", ");

                    return (
                      <div
                        key={suggestion.address.id}
                        className="flex items-center justify-between gap-4 rounded-md border p-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {suggestion.contactPersonName}{" "}
                            <span className="text-muted-foreground">
                              ({tC(suggestion.relationshipType)})
                            </span>
                          </p>
                          {addrText && (
                            <p className="text-sm text-muted-foreground truncate">
                              {addrText}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => applySuggestion(suggestion)}
                        >
                          {tC("useThisAddress")}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Shared address info */}
          {isSharedAddress && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>{tC("sharedAddress")}</AlertTitle>
              <AlertDescription>
                <p>{tC("sharedAddressInfo")}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {sharingWith.map((cp) => (
                    <Badge key={cp.id} variant="secondary">
                      {cp.firstName} {cp.lastName}
                      {cp.roles.length > 0 && (
                        <span className="ml-1 text-muted-foreground">
                          ({cp.roles.map((r) => tC(r)).join(", ")})
                        </span>
                      )}
                    </Badge>
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tC("sharedAddressWarning")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={unlinkAddress}
                >
                  <Unlink className="mr-2 h-3 w-3" />
                  {tC("createOwnAddress")}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-3 gap-4">
            <InputFormField
              name="street"
              label="street"
              className="col-span-2"
            />
            <InputFormField name="houseNumber" label="houseNumber" />
          </div>
          <InputFormField name="addressLine2" label="addressLine2" />
          <div className="grid grid-cols-3 gap-4">
            <InputFormField name="postalCode" label="postalCode" />
            <InputFormField
              name="city"
              label="city"
              className="col-span-2"
            />
          </div>
          <CountryComboboxFormField name="country" />

          {/* Remove address button */}
          {Boolean(
            form.watch("street") ||
              form.watch("postalCode") ||
              form.watch("city"),
          ) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={clearAddress}
            >
              {tC("removeAddress")}
            </Button>
          )}
        </section>

        <Separator />

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">{tC("notesSection")}</h3>
          <InputFormField name="notes" label="notes" />
        </section>

        <FormActionButtons
          disabled={form.formState.isSubmitting}
          onCancel={() => router.push(ROUTES.admin.contactPersons(locale))}
        />
      </form>
    </Form>
  );
}
