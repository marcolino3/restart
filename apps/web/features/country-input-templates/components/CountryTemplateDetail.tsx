"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Save, Trash2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { ROUTES } from "@/constants/routes";

import {
  CountryInputFieldType,
  CountryInputTemplate,
  CountryInputValidatorKind,
} from "../types";
import {
  CountryTemplateFieldFormSchema,
  CountryTemplateFieldFormType,
} from "../schemas/country-template-field-form.schema";
import { upsertCountryInputTemplateAction } from "../actions/upsert-country-input-template.action";
import { deleteCountryInputTemplateAction } from "../actions/delete-country-input-template.action";

// IBAN ist global standardisiert und hartcodiert in IbanFormField.
const FIELD_TYPES: CountryInputFieldType[] = ["PHONE", "SSN", "POSTAL_CODE"];

const FIELD_LABEL_KEYS: Record<CountryInputFieldType, string> = {
  PHONE: "phone",
  SSN: "ssn",
  POSTAL_CODE: "postalCode",
  IBAN: "iban",
};

const VALIDATOR_OPTIONS: { label: string; value: CountryInputValidatorKind }[] =
  [
    { label: "NONE", value: "NONE" },
    { label: "CH_SSN", value: "CH_SSN" },
    { label: "REGEX", value: "REGEX" },
  ];

const toDefaults = (
  t: CountryInputTemplate | undefined,
): CountryTemplateFieldFormType => ({
  mask: t?.mask ?? "",
  placeholder: t?.placeholder ?? "",
  maxLength: t?.maxLength?.toString() ?? "",
  regex: t?.regex ?? "",
  prefix: t?.prefix ?? "",
  validatorKind: t?.validatorKind ?? "NONE",
});

export const CountryTemplateDetail = ({
  countryCode,
  countryName,
  locale,
  initial,
}: {
  countryCode: string;
  countryName: string;
  locale: string;
  initial: CountryInputTemplate[];
}) => {
  const router = useRouter();
  const t = useTranslations("CountryTemplates");
  const [templates, setTemplates] = useState<CountryInputTemplate[]>(initial);

  const findExisting = (ft: CountryInputFieldType) =>
    templates.find((tpl) => tpl.fieldType === ft);

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(ROUTES.admin.countryTemplates(locale))}
        >
          ← {t("back")}
        </Button>
      </div>

      <div className="mb-2 flex items-baseline gap-3">
        <h1 className="text-2xl font-bold">{countryName}</h1>
        <span className="text-muted-foreground font-mono text-sm">
          {countryCode}
        </span>
      </div>

      {FIELD_TYPES.map((ft) => (
        <FieldSection
          key={ft}
          fieldType={ft}
          countryCode={countryCode}
          existing={findExisting(ft)}
          onSaved={(saved) =>
            setTemplates((prev) => {
              const idx = prev.findIndex(
                (x) => x.fieldType === saved.fieldType,
              );
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = saved;
                return next;
              }
              return [...prev, saved];
            })
          }
          onDeleted={(id) =>
            setTemplates((prev) => prev.filter((x) => x.id !== id))
          }
        />
      ))}
    </div>
  );
};

const FieldSection = ({
  fieldType,
  countryCode,
  existing,
  onSaved,
  onDeleted,
}: {
  fieldType: CountryInputFieldType;
  countryCode: string;
  existing: CountryInputTemplate | undefined;
  onSaved: (t: CountryInputTemplate) => void;
  onDeleted: (id: string) => void;
}) => {
  const t = useTranslations("CountryTemplates");
  const [pending, startTransition] = useTransition();

  const form = useForm<CountryTemplateFieldFormType>({
    resolver: zodResolver(CountryTemplateFieldFormSchema),
    defaultValues: toDefaults(existing),
  });

  const onSubmit = (values: CountryTemplateFieldFormType) => {
    startTransition(async () => {
      const res = await upsertCountryInputTemplateAction({
        countryCode,
        fieldType,
        mask: values.mask.trim(),
        placeholder: values.placeholder?.trim() || null,
        maxLength: values.maxLength?.trim()
          ? Number(values.maxLength.trim())
          : null,
        regex: values.regex?.trim() || null,
        prefix: values.prefix?.trim() || null,
        validatorKind: values.validatorKind,
      });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      onSaved(res.data);
      form.reset(toDefaults(res.data));
      toast.success(t("saved"));
    });
  };

  const remove = () => {
    if (!existing) return;
    if (!confirm(t("deleteConfirm"))) return;
    startTransition(async () => {
      const res = await deleteCountryInputTemplateAction(existing.id);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      onDeleted(existing.id);
      form.reset(toDefaults(undefined));
      toast.success(t("deleted"));
    });
  };

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t(FIELD_LABEL_KEYS[fieldType])}</CardTitle>
                <CardDescription>
                  {existing ? t("configured") : t("notConfigured")}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {existing && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={remove}
                    disabled={pending}
                  >
                    <Trash2 className="text-destructive mr-2 h-4 w-4" />{" "}
                    {t("delete")}
                  </Button>
                )}
                <Button type="submit" size="sm" disabled={pending}>
                  <Save className="mr-2 h-4 w-4" /> {t("save")}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <InputFormField
                  name="mask"
                  label="mask"
                  namespace="CountryTemplates"
                  placeholder="+41 99 999 99 99"
                  description="maskHint"
                />
              </div>
              <div className="col-span-2">
                <InputFormField
                  name="placeholder"
                  label="placeholder"
                  namespace="CountryTemplates"
                  placeholder="+41 79 123 45 67"
                />
              </div>
              <InputFormField
                name="maxLength"
                label="maxLength"
                namespace="CountryTemplates"
                type="number"
              />
              <SelectFormField
                name="validatorKind"
                label="validator"
                namespace="CountryTemplates"
                options={VALIDATOR_OPTIONS}
              />
              <InputFormField
                name="prefix"
                label="prefix"
                namespace="CountryTemplates"
                placeholder="+41 "
              />
              <InputFormField
                name="regex"
                label="regex"
                namespace="CountryTemplates"
              />
            </div>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
};
