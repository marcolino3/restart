"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { FormProvider, useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { SwitchFormField } from "@/components/form/form-fields/SwitchFormField";
import { ColorPickerFormField } from "@/components/form/form-fields/ColorPickerFormField";
import { NumberFormField } from "@/components/form/form-fields/NumberFormField";
import { handleAction } from "@/lib/actions/handle-action";
import { ROUTES } from "@/constants/routes";

import {
  ABSENCE_CATEGORY_FORM_DEFAULTS,
  absenceCategoryFormSchema,
  type AbsenceCategoryFormInput,
  type AbsenceCategoryFormValues,
} from "../schemas/employee-absence-category-form.schema";
import type {
  AbsenceCategoryItem,
  AbsenceCategoryLocale,
} from "../types";
import { createEmployeeAbsenceCategoryAction } from "../actions/create-employee-absence-category.action";
import { updateEmployeeAbsenceCategoryAction } from "../actions/update-employee-absence-category.action";

interface Props {
  mode: "create" | "edit";
  initial?: AbsenceCategoryItem;
}

const LOCALES: AbsenceCategoryLocale[] = ["DE", "FR", "IT", "EN"];

export function AbsenceCategoryForm({ mode, initial }: Props) {
  const t = useTranslations("AbsenceCategories");
  const router = useRouter();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<AbsenceCategoryLocale>("DE");

  const isSystem = !!initial?.isSystem;

  const form = useForm<AbsenceCategoryFormInput, unknown, AbsenceCategoryFormValues>({
    resolver: zodResolver(absenceCategoryFormSchema),
    defaultValues: initial
      ? mapInitialToFormValues(initial)
      : ABSENCE_CATEGORY_FORM_DEFAULTS,
  });

  const onSubmit = (values: AbsenceCategoryFormValues) => {
    startTransition(async () => {
      if (mode === "create") {
        await handleAction({
          action: () =>
            createEmployeeAbsenceCategoryAction({
              translations: values.translations,
              countsAsWorkTime: values.countsAsWorkTime,
              isPaid: values.isPaid,
              affectsVacationBalance: values.affectsVacationBalance,
              defaultIsVacationCapable: values.defaultIsVacationCapable,
              reducesVacationEntitlementAfterDays:
                values.reducesVacationEntitlementAfterDays ?? null,
              requiresCertificate: values.requiresCertificate,
              certificateRequiredFromDay:
                values.certificateRequiredFromDay ?? null,
              maxDaysPerYear: values.maxDaysPerYear ?? null,
              defaultPercentage: values.defaultPercentage,
              requiresApproval: values.requiresApproval,
              color: values.color,
              iconName: values.iconName,
              // sortOrder wird vom Backend automatisch ans Ende gesetzt;
              // Reihenfolge wird per DnD in der Liste verwaltet.
              sortOrder: 0,
            }),
          successMessage: t("createdToast"),
          errorMessage: t("createError"),
          onSuccess: () => router.push(ROUTES.admin.absenceCategories(locale)),
        });
      } else if (initial) {
        await handleAction({
          action: () =>
            updateEmployeeAbsenceCategoryAction({
              id: initial.id,
              translations: values.translations,
              // System-Kategorien: Behavior-Felder werden im Backend ignoriert,
              // aber wir senden sie nicht, um Missverstaendnisse zu vermeiden.
              ...(isSystem
                ? {}
                : {
                    countsAsWorkTime: values.countsAsWorkTime,
                    isPaid: values.isPaid,
                    affectsVacationBalance: values.affectsVacationBalance,
                    defaultIsVacationCapable: values.defaultIsVacationCapable,
                    reducesVacationEntitlementAfterDays:
                      values.reducesVacationEntitlementAfterDays ?? null,
                    requiresCertificate: values.requiresCertificate,
                    certificateRequiredFromDay:
                      values.certificateRequiredFromDay ?? null,
                    maxDaysPerYear: values.maxDaysPerYear ?? null,
                    defaultPercentage: values.defaultPercentage,
                    requiresApproval: values.requiresApproval,
                  }),
              color: values.color,
              iconName: values.iconName,
              // Reihenfolge wird per DnD in der Liste verwaltet.
            }),
          successMessage: t("savedToast"),
          errorMessage: t("saveError"),
          onSuccess: () => router.push(ROUTES.admin.absenceCategories(locale)),
        });
      }
    });
  };

  const onInvalid = (errors: FieldErrors<AbsenceCategoryFormInput>) => {
    // Translations-Fehler? -> zum richtigen Sprachen-Tab springen
    const translationErrors = errors.translations as
      | Array<{ name?: { message?: string }; description?: { message?: string } } | undefined>
      | undefined;
    if (Array.isArray(translationErrors)) {
      const idx = translationErrors.findIndex((e) => e?.name || e?.description);
      if (idx >= 0) {
        setActiveTab(LOCALES[idx]);
      }
    }

    // Erste Fehlermeldung sammeln und in einem Toast zeigen
    const firstMsg = collectFirstMessage(errors);
    toast.error(t("validationFailed"), {
      description: firstMsg ?? t("checkFieldsBelow"),
    });
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className="flex flex-col gap-6"
      >
        {isSystem && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>{t("systemCategoryNote")}</AlertDescription>
          </Alert>
        )}

        {/* Translations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {t("translationsTitle")}
              <Badge variant="outline">{t("germanRequired")}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as AbsenceCategoryLocale)}
            >
              <TabsList>
                {LOCALES.map((loc, idx) => (
                  <TabsTrigger key={loc} value={loc}>
                    {loc}
                    {loc === "DE" && <span className="ml-1 text-red-500">*</span>}
                    {translationHasContent(form.getValues(), idx) && (
                      <span
                        className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"
                        aria-hidden
                      />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
              {LOCALES.map((loc, idx) => (
                <TabsContent key={loc} value={loc} className="mt-4 space-y-4">
                  <InputFormField
                    name={`translations.${idx}.name`}
                    label={`nameLabel_${loc}`}
                    namespace="AbsenceCategories"
                  />
                  <TextareaFormField
                    name={`translations.${idx}.description`}
                    label={`descriptionLabel_${loc}`}
                    namespace="AbsenceCategories"
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Verhalten */}
        <Card>
          <CardHeader>
            <CardTitle>{t("behaviorTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SwitchFormField
                name="countsAsWorkTime"
                label="countsAsWorkTimeLabel"
                description="countsAsWorkTimeHelp"
                namespace="AbsenceCategories"
              />
              <SwitchFormField
                name="isPaid"
                label="isPaidLabel"
                description="isPaidHelp"
                namespace="AbsenceCategories"
              />
              <SwitchFormField
                name="affectsVacationBalance"
                label="affectsVacationBalanceLabel"
                description="affectsVacationBalanceHelp"
                namespace="AbsenceCategories"
              />
              <SwitchFormField
                name="defaultIsVacationCapable"
                label="defaultIsVacationCapableLabel"
                description="defaultIsVacationCapableHelp"
                namespace="AbsenceCategories"
              />
              <SwitchFormField
                name="requiresApproval"
                label="requiresApprovalLabel"
                description="requiresApprovalHelp"
                namespace="AbsenceCategories"
              />
              <SwitchFormField
                name="requiresCertificate"
                label="requiresCertificateLabel"
                description="requiresCertificateHelp"
                namespace="AbsenceCategories"
              />
            </div>
          </CardContent>
        </Card>

        {/* Limits & Defaults */}
        <Card>
          <CardHeader>
            <CardTitle>{t("limitsTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <NumberFormField
                name="defaultPercentage"
                label="defaultPercentageLabel"
                description="defaultPercentageHelp"
                min={1}
                max={100}
                nullable={false}
                namespace="AbsenceCategories"
              />
              <NumberFormField
                name="maxDaysPerYear"
                label="maxDaysPerYearLabel"
                description="maxDaysPerYearHelp"
                min={1}
                max={365}
                namespace="AbsenceCategories"
              />
              <NumberFormField
                name="certificateRequiredFromDay"
                label="certificateRequiredFromDayLabel"
                description="certificateRequiredFromDayHelp"
                min={1}
                max={90}
                namespace="AbsenceCategories"
              />
              <NumberFormField
                name="reducesVacationEntitlementAfterDays"
                label="reducesVacationEntitlementAfterDaysLabel"
                description="reducesVacationEntitlementAfterDaysHelp"
                min={1}
                max={365}
                namespace="AbsenceCategories"
              />
            </div>
          </CardContent>
        </Card>

        {/* UI */}
        <Card>
          <CardHeader>
            <CardTitle>{t("uiTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ColorPickerFormField
                name="color"
                label="colorLabel"
                namespace="AbsenceCategories"
              />
              <InputFormField
                name="iconName"
                label="iconNameLabel"
                description="iconNameHelp"
                placeholder="thermometer"
                namespace="AbsenceCategories"
              />
            </div>
            <p className="text-muted-foreground mt-3 text-xs">
              {t("sortOrderMovedToList")}
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.push(ROUTES.admin.absenceCategories(locale))
            }
          >
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? t("saving") : t("save")}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

function translationHasContent(
  values: AbsenceCategoryFormInput,
  idx: number,
): boolean {
  const t = values.translations[idx];
  return !!(t?.name && t.name.trim().length > 0);
}

function collectFirstMessage(
  errors: FieldErrors<AbsenceCategoryFormInput>,
): string | null {
  for (const value of Object.values(errors)) {
    if (!value) continue;
    if (typeof value === "object" && "message" in value && value.message) {
      return String(value.message);
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (!item || typeof item !== "object") continue;
        for (const sub of Object.values(item)) {
          if (
            sub &&
            typeof sub === "object" &&
            "message" in sub &&
            sub.message
          ) {
            return String(sub.message);
          }
        }
      }
    }
  }
  return null;
}

function mapInitialToFormValues(
  item: AbsenceCategoryItem,
): AbsenceCategoryFormInput {
  const byLocale = new Map(item.translations.map((t) => [t.locale, t]));
  return {
    translations: LOCALES.map((loc) => ({
      locale: loc,
      name: byLocale.get(loc)?.name ?? "",
      description: byLocale.get(loc)?.description ?? undefined,
    })),
    countsAsWorkTime: item.countsAsWorkTime,
    isPaid: item.isPaid,
    affectsVacationBalance: item.affectsVacationBalance,
    defaultIsVacationCapable: item.defaultIsVacationCapable,
    reducesVacationEntitlementAfterDays:
      item.reducesVacationEntitlementAfterDays,
    requiresCertificate: item.requiresCertificate,
    certificateRequiredFromDay: item.certificateRequiredFromDay,
    maxDaysPerYear: item.maxDaysPerYear,
    defaultPercentage: item.defaultPercentage,
    requiresApproval: item.requiresApproval,
    color: item.color,
    iconName: item.iconName,
    sortOrder: item.sortOrder,
  };
}
