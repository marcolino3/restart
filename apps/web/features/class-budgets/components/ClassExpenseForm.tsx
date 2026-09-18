"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { NumberFormField } from "@/components/form/form-fields/NumberFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";

import {
  createClassExpenseAction,
  updateClassExpenseAction,
} from "../actions/class-expenses-actions";
import { analyzeExpenseReceiptAction } from "../actions/expense-receipt-ai-actions";
import { expenseAiErrorKey } from "../lib/expense-ai-errors";
import {
  receiptSuggestionPatch,
  type SuggestedField,
} from "../lib/apply-receipt-suggestion";
import { discardReceipt } from "../lib/receipts";
import {
  createClassExpenseFormSchema,
  toClassExpenseInput,
  type ClassExpenseFormValues,
} from "../schemas/class-expense-form.schema";
import type { ClassExpense, ExpenseCategory } from "../types";
import { ReceiptPanel } from "./ReceiptPanel";

const NAMESPACE = "ClassBudgets";

interface Props {
  /** Present in update mode; create and update share the same form. */
  expense?: ClassExpense;
  schoolClasses: { id: string; name: string }[];
  categories: ExpenseCategory[];
  defaultSchoolClassId: string;
  defaultExpenseDate: string;
  /** Currency expenses are booked in; a receipt in another one is flagged. */
  currency: string;
  /** Offers "analyse with AI" when the org has a provider configured. */
  aiConfigured: boolean;
  /** Overview URL (with class and year) to go back to. */
  returnHref: string;
}

export function ClassExpenseForm({
  expense,
  schoolClasses,
  categories,
  defaultSchoolClassId,
  defaultExpenseDate,
  currency,
  aiConfigured,
  returnHref,
}: Props) {
  const t = useTranslations(NAMESPACE);
  const tC = useTranslations("Common");
  const router = useRouter();

  const schema = useMemo(() => createClassExpenseFormSchema(t), [t]);
  const form = useForm<ClassExpenseFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      schoolClassId: expense?.schoolClassId ?? defaultSchoolClassId,
      categoryId: expense?.categoryId ?? "",
      expenseDate: expense?.expenseDate ?? defaultExpenseDate,
      amount: expense?.amount ?? (undefined as unknown as number),
      vendor: expense?.vendor ?? "",
      invoiceNumber: expense?.invoiceNumber ?? "",
      description: expense?.description ?? "",
      receiptFileId: expense?.receiptFileId ?? null,
    },
  });

  const schoolClassId = useWatch({ control: form.control, name: "schoolClassId" });
  const receiptFileId = useWatch({ control: form.control, name: "receiptFileId" });

  // An archived category stays selectable for the expense that already uses it.
  const categoryOptions = categories
    .filter((c) => !c.isArchived || c.id === expense?.categoryId)
    .map((c) => ({ value: c.id, label: c.name }));
  const classOptions = schoolClasses.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const [analyzing, setAnalyzing] = useState(false);
  // Bumped after an AI prefill: the select keeps its value internally and
  // only picks up a programmatic change when it remounts.
  const [prefillRound, setPrefillRound] = useState(0);

  const onAnalyze = async () => {
    const fileId = form.getValues("receiptFileId");
    if (!fileId) return;
    setAnalyzing(true);
    const result = await analyzeExpenseReceiptAction(
      form.getValues("schoolClassId"),
      fileId,
    );
    setAnalyzing(false);
    if (!result.success) {
      toast.error(t("aiAnalyzeError"), {
        description: t(expenseAiErrorKey(result.error)),
      });
      return;
    }

    const patch = receiptSuggestionPatch(
      result.data,
      categoryOptions.map((option) => option.value),
      new Date().toLocaleDateString("sv-SE"),
    );
    const fields = Object.keys(patch) as SuggestedField[];
    if (fields.length === 0) {
      toast.warning(t("aiNothingFound"));
      return;
    }
    fields.forEach((field) =>
      form.setValue(field, patch[field] as never, {
        shouldDirty: true,
        shouldValidate: true,
      }),
    );
    setPrefillRound((round) => round + 1);
    if (result.data.currency && result.data.currency !== currency) {
      toast.warning(
        t("aiCurrencyMismatch", {
          found: result.data.currency,
          expected: currency,
        }),
      );
    } else {
      toast.success(t("aiPrefilled"));
    }
  };

  const leave = () => {
    router.push(returnHref);
    router.refresh();
  };

  const onCancel = async () => {
    const current = form.getValues("receiptFileId");
    if (current && current !== (expense?.receiptFileId ?? null)) {
      await discardReceipt(form.getValues("schoolClassId"), current).catch(
        () => undefined,
      );
    }
    leave();
  };

  const onSubmit = async (values: ClassExpenseFormValues) => {
    const input = toClassExpenseInput(values);
    const result = expense
      ? await updateClassExpenseAction({ id: expense.id, ...input })
      : await createClassExpenseAction(input);

    if (result.success) {
      toast.success(t(expense ? "expenseUpdated" : "expenseCreated"));
      leave();
    } else {
      toast.error(t("expenseSaveError"), { description: result.error });
    }
  };

  const busy = form.formState.isSubmitting || analyzing;

  return (
    <div className="space-y-4">
      <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        {tC("back")}
      </Button>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Sticky and viewport-high so the receipt stays readable while the
            form on the right is filled in. */}
        <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-9rem)]">
          <ReceiptPanel
            schoolClassId={schoolClassId}
            value={receiptFileId}
            onChange={(fileId) =>
              form.setValue("receiptFileId", fileId, { shouldDirty: true })
            }
            disabled={busy}
          />
        </div>
        <Card className="self-start">
          <CardHeader>
            <CardTitle>{t(expense ? "editExpense" : "newExpense")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <SelectFormField
                  name="schoolClassId"
                  label="schoolClass"
                  namespace={NAMESPACE}
                  options={classOptions}
                  translateOptions={false}
                  // The receipt is stored under the class it was uploaded for.
                  disabled={Boolean(receiptFileId)}
                />
                {aiConfigured && receiptFileId && (
                  <div className="space-y-1">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={onAnalyze}
                      disabled={busy}
                    >
                      {analyzing ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-1 h-4 w-4" />
                      )}
                      {t("aiAnalyze")}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {t("aiAnalyzeHint")}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DatePickerFormField
                    name="expenseDate"
                    label="expenseDate"
                    namespace={NAMESPACE}
                    dateOnly
                  />
                  <NumberFormField
                    name="amount"
                    label="amount"
                    namespace={NAMESPACE}
                    min={0.01}
                    // Must divide every valid amount from `min` on, otherwise the
                    // browser's native step validation silently blocks the submit.
                    step={0.01}
                  />
                </div>
                <SelectFormField
                  key={`category-${prefillRound}`}
                  name="categoryId"
                  label="category"
                  namespace={NAMESPACE}
                  options={categoryOptions}
                  translateOptions={false}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InputFormField
                    name="vendor"
                    label="vendor"
                    namespace={NAMESPACE}
                  />
                  <InputFormField
                    name="invoiceNumber"
                    label="invoiceNumber"
                    namespace={NAMESPACE}
                  />
                </div>
                <TextareaFormField
                  name="description"
                  label="description"
                  namespace={NAMESPACE}
                  rows={3}
                />
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={onCancel}>
                    {tC("cancel")}
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {tC("save")}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
