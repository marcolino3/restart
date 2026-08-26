"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { FormProvider, useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  Clock,
  Layers,
  Lock,
  Paperclip,
  ShieldCheck,
  Info,
} from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IconComboboxFormField } from "@/components/form/form-fields/IconComboboxFormField";
import { isCuratedIconName } from "@/components/form/form-fields/IconComboboxFormField";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { RadioCardFormField } from "@/components/form/form-fields/RadioCardFormField";
import { SwitchTileFormField } from "@/components/form/form-fields/SwitchTileFormField";
import { NamedColorPickerFormField } from "@/components/form/form-fields/NamedColorPickerFormField";
import { NumberFormField } from "@/components/form/form-fields/NumberFormField";
import { handleAction } from "@/lib/actions/handle-action";
import { ROUTES } from "@/constants/routes";

import {
  ABSENCE_CALENDAR_TITLE_DEFAULT,
  ABSENCE_CATEGORY_FORM_DEFAULTS,
  createAbsenceCategoryFormSchema,
  type AbsenceCategoryFormInput,
  type AbsenceCategoryFormValues,
} from "../schemas/employee-absence-category-form.schema";
import type { AbsenceCategoryItem, AbsenceCategoryLocale } from "../types";
import { createEmployeeAbsenceCategoryAction } from "../actions/create-employee-absence-category.action";
import { updateEmployeeAbsenceCategoryAction } from "../actions/update-employee-absence-category.action";

interface Props {
  mode: "create" | "edit";
  initial?: AbsenceCategoryItem;
  /** Page heading, rendered next to the form actions. */
  title: string;
  /** ISO country of the active organization; OR Art. 329b only applies to CH. */
  orgCountry?: string | null;
}

const LOCALES: AbsenceCategoryLocale[] = ["DE", "FR", "IT", "EN"];
const PLACEHOLDERS = ["{firstName}", "{lastName}", "{category}"] as const;

export function AbsenceCategoryForm({
  mode,
  initial,
  title,
  orgCountry,
}: Props) {
  const showVacationReduction = orgCountry === "CH";
  const t = useTranslations("AbsenceCategories");
  const router = useRouter();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<AbsenceCategoryLocale>("DE");

  const isSystem = !!initial?.isSystem;
  const listHref = ROUTES.admin.absenceCategories(locale);

  const schema = useMemo(
    () =>
      createAbsenceCategoryFormSchema({
        atLeastOneNameRequired: t("atLeastOneNameRequired"),
        maxDaysPerRequestNeedsRange: t("maxDaysPerRequestNeedsRange"),
      }),
    [t],
  );

  const form = useForm<
    AbsenceCategoryFormInput,
    unknown,
    AbsenceCategoryFormValues
  >({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? mapInitialToFormValues(initial)
      : ABSENCE_CATEGORY_FORM_DEFAULTS,
  });
  const watched = form.watch();
  const allowsDateRange = watched.allowsDateRange;
  const requiresCertificate = watched.requiresCertificate;
  const requiresApproval = watched.requiresApproval;
  const syncToCalendar = watched.syncToCalendar;
  const filledLocales = LOCALES.filter((_, idx) =>
    translationHasContent(watched, idx),
  ).length;

  const toPayload = (values: AbsenceCategoryFormValues) => ({
    translations: values.translations,
    countsAsWorkTime: values.countsAsWorkTime,
    isPaid: values.isPaid,
    affectsVacationBalance: values.affectsVacationBalance,
    defaultIsVacationCapable: values.defaultIsVacationCapable,
    reducesVacationEntitlementAfterDays:
      values.reducesVacationEntitlementAfterDays ?? null,
    requiresCertificate: values.requiresCertificate,
    certificateRequiredFromDay: values.requiresCertificate
      ? (values.certificateRequiredFromDay ?? null)
      : null,
    maxDaysPerYear: values.maxDaysPerYear ?? null,
    entryPrecision: values.entryPrecision,
    allowsDateRange: values.allowsDateRange,
    maxDaysPerRequest: values.allowsDateRange
      ? (values.maxDaysPerRequest ?? null)
      : null,
    maxDaysAhead: values.maxDaysAhead ?? null,
    defaultPercentage: values.defaultPercentage,
    requiresApproval: values.requiresApproval,
    color: values.color,
    iconName: values.iconName,
    syncToCalendar: values.syncToCalendar,
    calendarTitleTemplate: values.syncToCalendar
      ? values.calendarTitleTemplate || null
      : null,
  });

  const onSubmit = (values: AbsenceCategoryFormValues) => {
    startTransition(async () => {
      if (mode === "create") {
        await handleAction({
          action: () =>
            createEmployeeAbsenceCategoryAction({
              ...toPayload(values),
              // sortOrder is appended by the backend; order is managed by
              // drag and drop in the list.
              sortOrder: 0,
            }),
          successMessage: t("createdToast"),
          errorMessage: t("createError"),
          onSuccess: () => router.push(listHref),
        });
      } else if (initial) {
        await handleAction({
          action: () =>
            // System categories are only undeletable; behaviour and limits
            // are editable like custom ones.
            updateEmployeeAbsenceCategoryAction({
              id: initial.id,
              ...toPayload(values),
            }),
          successMessage: t("savedToast"),
          errorMessage: t("saveError"),
          onSuccess: () => router.push(listHref),
        });
      }
    });
  };

  const onInvalid = (errors: FieldErrors<AbsenceCategoryFormInput>) => {
    const translationErrors = errors.translations as
      | Array<
          | { name?: { message?: string }; description?: { message?: string } }
          | undefined
        >
      | undefined;
    if (Array.isArray(translationErrors)) {
      const idx = translationErrors.findIndex((e) => e?.name || e?.description);
      if (idx >= 0) setActiveTab(LOCALES[idx]);
    }
    toast.error(t("validationFailed"), {
      description: collectFirstMessage(errors) ?? t("checkFieldsBelow"),
    });
  };

  const insertPlaceholder = (token: string) => {
    const current = form.getValues("calendarTitleTemplate") ?? "";
    form.setValue(
      "calendarTitleTemplate",
      current ? `${current.replace(/\s+$/, "")} ${token}` : token,
      { shouldDirty: true },
    );
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className="flex flex-col gap-4"
      >
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <Link
              href={listHref}
              className="text-muted-foreground hover:text-foreground flex w-fit items-center text-xs"
            >
              <ChevronLeft className="mr-0.5 h-3.5 w-3.5" />
              {t("pageTitle")}
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{title}</h1>
              {isSystem && (
                <Badge variant="secondary" className="font-normal">
                  {t("systemBadge")}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(listHref)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </div>

        {isSystem && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertTitle>{t("systemLocked")}</AlertTitle>
            <AlertDescription>{t("systemCategoryNote")}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
          {/* Left column */}
          <div className="flex min-w-0 flex-col gap-4 xl:col-span-2">
            {/* Translations */}
            <Card>
              <CardHeader>
                <CardTitle>{t("translationsTitle")}</CardTitle>
                <CardDescription>{t("localeHint")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={activeTab}
                  onValueChange={(v) =>
                    setActiveTab(v as AbsenceCategoryLocale)
                  }
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <TabsList>
                      {LOCALES.map((loc, idx) => (
                        <TabsTrigger key={loc} value={loc}>
                          {loc}
                          <span
                            className={
                              translationHasContent(watched, idx)
                                ? "ml-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"
                                : "ml-1 inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/30"
                            }
                            aria-hidden
                          />
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    <span className="text-muted-foreground text-xs">
                      {t("localesFilled", {
                        n: filledLocales,
                        total: LOCALES.length,
                      })}
                    </span>
                  </div>
                  {LOCALES.map((loc, idx) => (
                    <TabsContent
                      key={loc}
                      value={loc}
                      className="mt-4 space-y-4"
                    >
                      <InputFormField
                        name={`translations.${idx}.name`}
                        label={`nameLabel_${loc}`}
                        namespace="AbsenceCategories"
                      />
                      <TextareaFormField
                        name={`translations.${idx}.description`}
                        label={`descriptionLabel_${loc}`}
                        description="descriptionHelp"
                        rows={3}
                        namespace="AbsenceCategories"
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Behaviour */}
            <Card>
              <CardHeader>
                <CardTitle>{t("behaviorTitle")}</CardTitle>
                <CardDescription>{t("behaviorSubtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SectionLabel>{t("sectionBasics")}</SectionLabel>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                    placeholder={t("unlimited")}
                    min={1}
                    max={365}
                    namespace="AbsenceCategories"
                  />
                </div>

                <SectionLabel>{t("sectionAccounting")}</SectionLabel>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <SwitchTileFormField
                    name="countsAsWorkTime"
                    label="countsAsWorkTimeLabel"
                    description="countsAsWorkTimeHelp"
                    icon={<Clock />}
                    namespace="AbsenceCategories"
                  />
                  <SwitchTileFormField
                    name="isPaid"
                    label="isPaidLabel"
                    description="isPaidHelp"
                    icon={<BarChart3 />}
                    namespace="AbsenceCategories"
                  />
                  <SwitchTileFormField
                    name="affectsVacationBalance"
                    label="affectsVacationBalanceLabel"
                    description="affectsVacationBalanceHelp"
                    icon={<Layers />}
                    namespace="AbsenceCategories"
                  />
                  <SwitchTileFormField
                    name="defaultIsVacationCapable"
                    label="defaultIsVacationCapableLabel"
                    description="defaultIsVacationCapableHelp"
                    icon={<CalendarRange />}
                    namespace="AbsenceCategories"
                  >
                    {showVacationReduction && (
                      <>
                        <NumberFormField
                          name="reducesVacationEntitlementAfterDays"
                          label="reducesVacationEntitlementAfterDaysLabel"
                          description="reducesVacationEntitlementAfterDaysHelp"
                          placeholder={t("noReduction")}
                          min={0}
                          max={365}
                          namespace="AbsenceCategories"
                        />
                        <div className="bg-muted/50 text-muted-foreground flex gap-2 rounded-md p-2 text-xs">
                          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <div className="space-y-1">
                            <p className="text-foreground font-medium">
                              {t("reductionRuleTitle")}
                            </p>
                            <p>{t("reductionRuleText")}</p>
                            <p>{t("reductionRuleExample")}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </SwitchTileFormField>
                </div>

                <SectionLabel>{t("sectionRecording")}</SectionLabel>
                <div className="space-y-2">
                  <p className="text-sm font-semibold">
                    {t("entryPrecisionLabel")}
                  </p>
                  <RadioCardFormField
                    name="entryPrecision"
                    columns={3}
                    options={ENTRY_PRECISIONS.map((value) => ({
                      value,
                      label: t(`entryPrecision.${value}.label`),
                      description: t(`entryPrecision.${value}.help`),
                    }))}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <SwitchTileFormField
                    name="requiresApproval"
                    label="requiresApprovalLabel"
                    description="requiresApprovalHelp"
                    icon={<ShieldCheck />}
                    namespace="AbsenceCategories"
                  >
                    {!requiresApproval && (
                      <NumberFormField
                        name="maxDaysAhead"
                        label="maxDaysAheadLabel"
                        description="maxDaysAheadHelp"
                        placeholder={t("unlimited")}
                        min={0}
                        max={365}
                        namespace="AbsenceCategories"
                      />
                    )}
                  </SwitchTileFormField>
                  <SwitchTileFormField
                    name="allowsDateRange"
                    label="allowsDateRangeLabel"
                    description="allowsDateRangeHelp"
                    icon={<ArrowRight />}
                    namespace="AbsenceCategories"
                  >
                    {allowsDateRange && (
                      <NumberFormField
                        name="maxDaysPerRequest"
                        label="maxDaysPerRequestLabel"
                        description="maxDaysPerRequestHelp"
                        placeholder={t("unlimited")}
                        min={1}
                        max={365}
                        namespace="AbsenceCategories"
                      />
                    )}
                  </SwitchTileFormField>
                  <SwitchTileFormField
                    name="requiresCertificate"
                    label="requiresCertificateLabel"
                    description="requiresCertificateHelp"
                    icon={<Paperclip />}
                    namespace="AbsenceCategories"
                  >
                    {requiresCertificate && (
                      <NumberFormField
                        name="certificateRequiredFromDay"
                        label="certificateRequiredFromDayLabel"
                        description="certificateRequiredFromDayHelp"
                        placeholder="—"
                        min={1}
                        max={90}
                        namespace="AbsenceCategories"
                      />
                    )}
                  </SwitchTileFormField>
                </div>
              </CardContent>
            </Card>

            {/* Calendar */}
            <Card>
              <CardHeader>
                <CardTitle>{t("calendarTitle")}</CardTitle>
                <CardDescription>{t("calendarSubtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SwitchTileFormField
                  name="syncToCalendar"
                  label="syncToCalendarLabel"
                  description="syncToCalendarHelp"
                  icon={<CalendarDays />}
                  namespace="AbsenceCategories"
                />
                {syncToCalendar && (
                  <div className="space-y-2">
                    <InputFormField
                      name="calendarTitleTemplate"
                      label="calendarTitleTemplateLabel"
                      placeholder={ABSENCE_CALENDAR_TITLE_DEFAULT}
                      namespace="AbsenceCategories"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-muted-foreground">
                        {t("insertPlaceholder")}
                      </span>
                      {PLACEHOLDERS.map((token) => (
                        <button
                          key={token}
                          type="button"
                          onClick={() => insertPlaceholder(token)}
                          className="bg-primary/10 text-primary hover:bg-primary/20 rounded-md px-2 py-0.5 font-mono"
                        >
                          {token}
                        </button>
                      ))}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {t("calendarTitleTemplateHelp")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("uiTitle")}</CardTitle>
                <CardDescription>{t("uiSubtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <NamedColorPickerFormField
                  name="color"
                  label="colorLabel"
                  namespace="AbsenceCategories"
                />
                <IconComboboxFormField
                  name="iconName"
                  label="iconNameLabel"
                  description="iconNameHelp"
                  namespace="AbsenceCategories"
                />
              </CardContent>
            </Card>

            <Preview values={watched} locale={locale} />
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

const ENTRY_PRECISIONS = ["DAY", "HALF_DAY", "TIME"] as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
        {children}
      </span>
      <span className="bg-border h-px flex-1" />
    </div>
  );
}

function Preview({
  values,
  locale,
}: {
  values: AbsenceCategoryFormInput;
  locale: string;
}) {
  const t = useTranslations("AbsenceCategories");
  const idx = LOCALES.indexOf(locale.toUpperCase() as AbsenceCategoryLocale);
  const name =
    values.translations[idx >= 0 ? idx : 0]?.name?.trim() ||
    values.translations.find((tr) => tr.name?.trim())?.name ||
    t("previewUnnamed");
  const color = values.color ?? "#94A3B8";
  const [firstName, lastName] = t("previewSampleName").split(" ");
  const calendarTitle = (
    values.calendarTitleTemplate?.trim() || ABSENCE_CALENDAR_TITLE_DEFAULT
  )
    .replace(/\{firstName\}/g, firstName ?? "")
    .replace(/\{lastName\}/g, lastName ?? "")
    .replace(/\{category\}/g, name)
    .replace(/\s+/g, " ")
    .trim();

  const summary = [
    values.requiresApproval ? t("badgeApproval") : t("badgeNoticeOnly"),
    t(`entryPrecision.${values.entryPrecision}.label`),
    values.allowsDateRange ? t("limitDateRange") : t("previewSingleDay"),
    values.requiresCertificate
      ? t("badgeCertificate")
      : t("previewNoCertificate"),
    values.affectsVacationBalance ? t("affectsVacationBalanceLabel") : null,
    values.isPaid ? t("badgePaid") : t("previewUnpaid"),
  ]
    .filter(Boolean)
    .join(" · ")
    .toLowerCase();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("previewTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <SectionLabel>{t("previewListLabel")}</SectionLabel>
          <div className="bg-muted/40 flex items-center justify-between rounded-md px-3 py-2 text-sm">
            <span className="flex items-center gap-2">
              {isCuratedIconName(values.iconName) ? (
                <DynamicIcon
                  name={values.iconName}
                  className="h-4 w-4"
                  style={{ color }}
                />
              ) : (
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
              )}
              <span className="font-medium">{name}</span>
            </span>
            <Badge variant="outline" className="font-normal">
              {values.isPaid ? t("badgePaid") : t("previewUnpaid")}
            </Badge>
          </div>
        </div>
        {values.syncToCalendar && (
          <div className="space-y-2">
            <SectionLabel>{t("previewCalendarLabel")}</SectionLabel>
            <div
              className="bg-muted/40 rounded-md border-l-4 px-3 py-2"
              style={{ borderLeftColor: color }}
            >
              <div className="text-sm font-medium">{calendarTitle}</div>
              <div className="text-muted-foreground text-xs">
                {values.entryPrecision === "TIME"
                  ? t("previewSampleTime")
                  : t("previewSampleDates")}
              </div>
            </div>
          </div>
        )}
        <p className="text-muted-foreground text-xs">{summary}</p>
      </CardContent>
    </Card>
  );
}

function translationHasContent(
  values: AbsenceCategoryFormInput,
  idx: number,
): boolean {
  const tr = values.translations[idx];
  return !!(tr?.name && tr.name.trim().length > 0);
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
  const byLocale = new Map(item.translations.map((tr) => [tr.locale, tr]));
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
    allowsDateRange: item.allowsDateRange,
    entryPrecision: item.entryPrecision ?? "DAY",
    maxDaysPerRequest: item.maxDaysPerRequest,
    maxDaysAhead: item.maxDaysAhead ?? null,
    defaultPercentage: item.defaultPercentage,
    requiresApproval: item.requiresApproval,
    color: item.color,
    iconName: item.iconName,
    syncToCalendar: item.syncToCalendar,
    calendarTitleTemplate: item.calendarTitleTemplate,
  };
}
