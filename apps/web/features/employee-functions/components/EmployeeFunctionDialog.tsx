"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { FormProvider, useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { handleAction } from "@/lib/actions/handle-action";

import {
  EMPLOYEE_FUNCTION_FORM_DEFAULTS,
  createEmployeeFunctionFormSchema,
  type EmployeeFunctionFormInput,
  type EmployeeFunctionFormValues,
} from "../schemas/employee-function-form.schema";
import type {
  EmployeeFunctionItem,
  EmployeeFunctionLocale,
} from "../types";
import { createEmployeeFunctionAction } from "../actions/create-employee-function.action";
import { updateEmployeeFunctionAction } from "../actions/update-employee-function.action";

const LOCALES: EmployeeFunctionLocale[] = ["DE", "FR", "IT", "EN"];

interface Props {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: EmployeeFunctionItem;
  onSaved: (item: EmployeeFunctionItem) => void;
}

export function EmployeeFunctionDialog({
  mode,
  open,
  onOpenChange,
  initial,
  onSaved,
}: Props) {
  const t = useTranslations("EmployeeFunctions");
  const tC = useTranslations("Common");
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<EmployeeFunctionLocale>("DE");

  const schema = useMemo(
    () =>
      createEmployeeFunctionFormSchema({
        atLeastOneNameRequired: t("atLeastOneNameRequired"),
      }),
    [t],
  );

  const form = useForm<
    EmployeeFunctionFormInput,
    unknown,
    EmployeeFunctionFormValues
  >({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? mapInitialToFormValues(initial)
      : EMPLOYEE_FUNCTION_FORM_DEFAULTS,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        initial
          ? mapInitialToFormValues(initial)
          : EMPLOYEE_FUNCTION_FORM_DEFAULTS,
      );
      setActiveTab("DE");
    }
  }, [open, initial, form]);

  const onSubmit = (values: EmployeeFunctionFormValues) => {
    const translations = values.translations.map((tr) => ({
      locale: tr.locale,
      name: tr.name.trim(),
    }));
    startTransition(async () => {
      if (mode === "create") {
        await handleAction({
          action: () => createEmployeeFunctionAction({ translations }),
          successMessage: t("createdToast"),
          errorMessage: t("createError"),
          onSuccess: (data) => {
            onSaved(data);
            onOpenChange(false);
          },
        });
      } else if (initial) {
        await handleAction({
          action: () =>
            updateEmployeeFunctionAction({ id: initial.id, translations }),
          successMessage: t("updatedToast"),
          errorMessage: t("updateError"),
          onSuccess: (data) => {
            onSaved(data);
            onOpenChange(false);
          },
        });
      }
    });
  };

  const onInvalid = (errors: FieldErrors<EmployeeFunctionFormInput>) => {
    const translationErrors = errors.translations;
    if (!translationErrors) return;

    if (Array.isArray(translationErrors)) {
      const firstWithError = translationErrors.findIndex(
        (entry) => entry && typeof entry === "object" && "name" in entry,
      );
      if (firstWithError >= 0) {
        setActiveTab(LOCALES[firstWithError] ?? "DE");
        return;
      }
    }

    setActiveTab("DE");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? t("addTitle") : t("editTitle")}
          </DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
            <DialogBody className="space-y-4">
              <p className="text-xs text-muted-foreground">{t("localeHint")}</p>
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as EmployeeFunctionLocale)}
              >
                <TabsList className="grid w-full grid-cols-4">
                  {LOCALES.map((loc) => (
                    <TabsTrigger key={loc} value={loc}>
                      {loc}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {LOCALES.map((loc, index) => (
                  <TabsContent key={loc} value={loc} className="mt-3">
                    <InputFormField
                      name={`translations.${index}.name`}
                      label="nameLabel"
                      namespace="EmployeeFunctions"
                      placeholder={t(
                        loc === "DE"
                          ? "namePlaceholder"
                          : `namePlaceholder_${loc}`,
                      )}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                {tC("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {mode === "create" ? t("addButton") : tC("save")}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

function mapInitialToFormValues(
  item: EmployeeFunctionItem,
): EmployeeFunctionFormInput {
  return {
    translations: LOCALES.map((locale) => ({
      locale,
      name:
        item.translations.find((tr) => tr.locale === locale)?.name ??
        (locale === "DE" ? item.name : ""),
    })),
  };
}
