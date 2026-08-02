"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

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
  CountryTemplateFieldFormType,
  CountryTemplateFormSchema,
  CountryTemplateFormType,
} from "../schemas/country-template-field-form.schema";
import { upsertCountryInputTemplateAction } from "../actions/upsert-country-input-template.action";

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

const FIELD_EXAMPLE_PLACEHOLDERS: Record<
  CountryInputFieldType,
  { mask: string; placeholder: string; prefix?: string }
> = {
  PHONE: {
    mask: "+41 99 999 99 99",
    placeholder: "+41 79 123 45 67",
    prefix: "+41 ",
  },
  SSN: {
    mask: "999.9999.9999.99",
    placeholder: "756.XXXX.XXXX.XX",
    prefix: "756.",
  },
  POSTAL_CODE: {
    mask: "9999",
    placeholder: "1234",
  },
  IBAN: {
    mask: "",
    placeholder: "",
  },
};

const toFieldDefaults = (
  t: CountryInputTemplate | undefined,
): CountryTemplateFieldFormType => ({
  mask: t?.mask ?? "",
  placeholder: t?.placeholder ?? "",
  maxLength: t?.maxLength?.toString() ?? "",
  regex: t?.regex ?? "",
  prefix: t?.prefix ?? "",
  validatorKind: t?.validatorKind ?? "NONE",
});

const toFormDefaults = (
  templates: CountryInputTemplate[],
): CountryTemplateFormType => {
  const findExisting = (ft: CountryInputFieldType) =>
    templates.find((tpl) => tpl.fieldType === ft);

  return {
    PHONE: toFieldDefaults(findExisting("PHONE")),
    SSN: toFieldDefaults(findExisting("SSN")),
    POSTAL_CODE: toFieldDefaults(findExisting("POSTAL_CODE")),
  };
};

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
  const tCommon = useTranslations("Common");
  const [pending, startTransition] = useTransition();

  const findExisting = (ft: CountryInputFieldType) =>
    initial.find((tpl) => tpl.fieldType === ft);

  const form = useForm<CountryTemplateFormType>({
    resolver: zodResolver(CountryTemplateFormSchema),
    defaultValues: toFormDefaults(initial),
  });

  const onSubmit = (values: CountryTemplateFormType) => {
    startTransition(async () => {
      const toSave = FIELD_TYPES.filter((ft) => values[ft].mask.trim().length > 0);

      if (toSave.length === 0) {
        toast.error(t("maskRequired"));
        return;
      }

      for (const fieldType of toSave) {
        const fieldValues = values[fieldType];
        const res = await upsertCountryInputTemplateAction({
          countryCode,
          fieldType,
          mask: fieldValues.mask.trim(),
          placeholder: fieldValues.placeholder?.trim() || null,
          maxLength: fieldValues.maxLength?.trim()
            ? Number(fieldValues.maxLength.trim())
            : null,
          regex: fieldValues.regex?.trim() || null,
          prefix: fieldValues.prefix?.trim() || null,
          validatorKind: fieldValues.validatorKind,
        });

        if (!res.success) {
          toast.error(res.error);
          return;
        }
      }

      toast.success(t("saved"));
      router.push(ROUTES.admin.countryTemplates(locale));
    });
  };

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

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="mb-2 flex items-center justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-bold">{countryName}</h1>
              <span className="text-muted-foreground font-mono text-sm">
                {countryCode}
              </span>
            </div>
            <Button type="submit" disabled={pending}>
              {tCommon("save")}
            </Button>
          </div>

          {FIELD_TYPES.map((ft) => (
            <FieldSection
              key={ft}
              fieldType={ft}
              existing={findExisting(ft)}
            />
          ))}
        </form>
      </Form>
    </div>
  );
};

const FieldSection = ({
  fieldType,
  existing,
}: {
  fieldType: CountryInputFieldType;
  existing: CountryInputTemplate | undefined;
}) => {
  const t = useTranslations("CountryTemplates");
  const prefix = fieldType;
  const examples = FIELD_EXAMPLE_PLACEHOLDERS[fieldType];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(FIELD_LABEL_KEYS[fieldType])}</CardTitle>
        <CardDescription>
          {existing ? t("configured") : t("notConfigured")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <InputFormField
              name={`${prefix}.mask`}
              label="mask"
              namespace="CountryTemplates"
              placeholder={examples.mask}
              description="maskHint"
            />
          </div>
          <div className="col-span-2">
            <InputFormField
              name={`${prefix}.placeholder`}
              label="placeholder"
              namespace="CountryTemplates"
              placeholder={examples.placeholder}
            />
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-4">
            <InputFormField
              name={`${prefix}.maxLength`}
              label="maxLength"
              namespace="CountryTemplates"
              type="number"
            />
            <SelectFormField
              name={`${prefix}.validatorKind`}
              label="validator"
              namespace="CountryTemplates"
              options={VALIDATOR_OPTIONS}
            />
          </div>
          <p className="text-muted-foreground col-span-2 text-sm">
            {t("maxLengthHint")}
          </p>
          <InputFormField
            name={`${prefix}.prefix`}
            label="prefix"
            namespace="CountryTemplates"
            placeholder={examples.prefix}
          />
          <InputFormField
            name={`${prefix}.regex`}
            label="regex"
            namespace="CountryTemplates"
          />
        </div>
      </CardContent>
    </Card>
  );
};
