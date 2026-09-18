"use client";

import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { discardReceipt } from "../lib/receipts";
import {
  createClassExpenseFormSchema,
  toClassExpenseInput,
  type ClassExpenseFormValues,
} from "../schemas/class-expense-form.schema";
import type { ClassExpense, ExpenseCategory } from "../types";
import { ReceiptField } from "./ReceiptField";

const NAMESPACE = "ClassBudgets";

interface Props {
  /** Present in update mode; create and update share the same form. */
  expense?: ClassExpense;
  schoolClasses: { id: string; name: string }[];
  categories: ExpenseCategory[];
  defaultSchoolClassId: string;
  defaultExpenseDate: string;
  onClose: () => void;
}

export function ClassExpenseDialog({
  expense,
  schoolClasses,
  categories,
  defaultSchoolClassId,
  defaultExpenseDate,
  onClose,
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

  const onCancel = async () => {
    const current = form.getValues("receiptFileId");
    if (current && current !== (expense?.receiptFileId ?? null)) {
      await discardReceipt(form.getValues("schoolClassId"), current).catch(
        () => undefined,
      );
    }
    onClose();
  };

  const onSubmit = async (values: ClassExpenseFormValues) => {
    const input = toClassExpenseInput(values);
    const result = expense
      ? await updateClassExpenseAction({ id: expense.id, ...input })
      : await createClassExpenseAction(input);

    if (result.success) {
      toast.success(t(expense ? "expenseUpdated" : "expenseCreated"));
      router.refresh();
      onClose();
    } else {
      toast.error(t("expenseSaveError"), { description: result.error });
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{t(expense ? "editExpense" : "newExpense")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody className="space-y-4">
              <SelectFormField
                name="schoolClassId"
                label="schoolClass"
                namespace={NAMESPACE}
                options={classOptions}
                translateOptions={false}
                // The receipt is stored under the class it was uploaded for.
                disabled={Boolean(receiptFileId)}
              />
              <ReceiptField
                schoolClassId={schoolClassId}
                value={receiptFileId}
                onChange={(fileId) =>
                  form.setValue("receiptFileId", fileId, { shouldDirty: true })
                }
                disabled={form.formState.isSubmitting}
              />
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
                  step={0.05}
                />
              </div>
              <SelectFormField
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
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onCancel}>
                {tC("cancel")}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {tC("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
