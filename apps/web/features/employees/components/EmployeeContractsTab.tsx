"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FileText, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { SwitchFormField } from "@/components/form/form-fields/SwitchFormField";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { handleAction } from "@/lib/actions/handle-action";

import type { EmployeeContract } from "../actions/employee-contracts.actions";
import {
  saveEmployeeContractAction,
  deleteEmployeeContractAction,
} from "../actions/employee-contracts.actions";
import {
  EmployeeContractFormSchema,
  EmployeeContractFormOutput,
} from "../schemas/employee-contract-form.schema";
import { FormRow } from "./EmployeeFormSections";
import { ContractDocumentField } from "./ContractDocumentField";

interface Props {
  employeeId: string;
  contracts: EmployeeContract[];
  /** when true, show edit/delete actions */
  editable?: boolean;
}

const contractTypeOptions = [
  { label: "contractType.PERMANENT", value: "PERMANENT" },
  { label: "contractType.TEMPORARY", value: "TEMPORARY" },
  { label: "contractType.INTERNSHIP", value: "INTERNSHIP" },
  { label: "contractType.APPRENTICESHIP", value: "APPRENTICESHIP" },
];

const paymentIntervalOptions = [
  { label: "paymentInterval.MONTHLY_X12", value: "MONTHLY_X12" },
  { label: "paymentInterval.MONTHLY_X13", value: "MONTHLY_X13" },
];

export default function EmployeeContractsTab({
  employeeId,
  contracts,
  editable,
}: Props) {
  const t = useTranslations("Common");
  const tE = useTranslations("Employees");
  const locale = useLocale();
  const router = useRouter();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeContract | null>(null);

  const formatDate = (s?: string | null) => {
    if (!s) return "–";
    return new Date(s).toLocaleDateString(
      locale === "de" ? "de-CH" : "en-GB",
      { day: "2-digit", month: "short", year: "numeric" },
    );
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (c: EmployeeContract) => {
    setEditing(c);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(tE("contract.deleteConfirm"))) return;
    const res = await deleteEmployeeContractAction(id);
    if (res.success) {
      toast.success(tE("contract.deleted"));
      router.refresh();
    } else {
      toast.error(tE("contract.deleteError"));
    }
  };

  return (
    <>
      <div className="flex items-center justify-between px-4 sm:px-0 mb-4">
        <div>
          <h3 className="text-base/7 font-semibold text-foreground">
            {tE("contracts")}
          </h3>
          <p className="mt-1 text-sm/6 text-muted-foreground">
            {tE("contract.listDescription")}
          </p>
        </div>
        {editable && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {tE("contract.create")}
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tE("hr.entryDate")}</TableHead>
              <TableHead>{tE("hr.exitDate")}</TableHead>
              <TableHead>{tE("hr.contractType")}</TableHead>
              <TableHead>{tE("hr.position")}</TableHead>
              <TableHead className="text-right">{tE("hr.workloadPercent")}</TableHead>
              <TableHead className="w-24 text-center">
                {tE("contract.document")}
              </TableHead>
              {editable && <TableHead className="w-24"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={editable ? 7 : 6}
                  className="text-center text-sm text-muted-foreground h-24"
                >
                  {tE("contract.noContracts")}
                </TableCell>
              </TableRow>
            ) : (
              contracts.map((c) => (
                <TableRow key={c.id} className={editable ? "cursor-pointer" : undefined}>
                  <TableCell>{formatDate(c.startDate)}</TableCell>
                  <TableCell>{formatDate(c.endDate)}</TableCell>
                  <TableCell>
                    {c.contractType ? (
                      <Badge variant="secondary">
                        {tE(`contractType.${c.contractType}`)}
                      </Badge>
                    ) : (
                      "–"
                    )}
                  </TableCell>
                  <TableCell>{c.position || "–"}</TableCell>
                  <TableCell className="text-right">
                    {c.workloadPercent != null ? `${c.workloadPercent}%` : "–"}
                  </TableCell>
                  <TableCell className="text-center">
                    {c.documentUrl ? (
                      <a
                        href={c.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={tE("contract.docView")}
                        className="inline-flex text-primary hover:text-primary/80"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FileText className="h-4 w-4" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </TableCell>
                  {editable && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(c)}
                        aria-label={t("edit")}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(c.id)}
                        aria-label={t("delete")}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editable && (
        <ContractDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          employeeId={employeeId}
          contract={editing}
          onSaved={() => {
            setDialogOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  contract: EmployeeContract | null;
  onSaved: () => void;
}

function ContractDialog({
  open,
  onOpenChange,
  employeeId,
  contract,
  onSaved,
}: DialogProps) {
  const tE = useTranslations("Employees");

  const form = useForm({
    resolver: zodResolver(EmployeeContractFormSchema),
    defaultValues: {
      id: contract?.id,
      employeeId,
      startDate: contract?.startDate ? new Date(contract.startDate) : new Date(),
      endDate: contract?.endDate ? new Date(contract.endDate) : null,
      probationEndDate: contract?.probationEndDate
        ? new Date(contract.probationEndDate)
        : null,
      contractType: contract?.contractType ?? undefined,
      position: contract?.position ?? "",
      supervisorMembershipId: contract?.supervisorMembershipId ?? null,
      workloadPercent: contract?.workloadPercent ?? null,
      weeklyHours: contract?.weeklyHours ?? "",
      grossSalary: contract?.grossSalary ?? null,
      paymentInterval: contract?.paymentInterval ?? undefined,
      has13thSalary: contract?.has13thSalary ?? false,
      annualVacationDays: contract?.annualVacationDays ?? null,
      remainingVacationDays: contract?.remainingVacationDays ?? "",
      notes: contract?.notes ?? "",
      documentUrl: contract?.documentUrl ?? "",
    },
  });

  const onValid = async (values: Record<string, unknown>) => {
    await handleAction({
      action: () =>
        saveEmployeeContractAction(values as EmployeeContractFormOutput),
      successMessage: contract ? tE("contract.updated") : tE("contract.created"),
      errorMessage: tE("contract.saveError"),
      onSuccess: onSaved,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {contract ? tE("contract.edit") : tE("contract.create")}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onValid, (errors) => {
              console.warn("Contract validation errors:", errors);
              toast.error(tE("validationError"));
            })}
          >
            <div className="border-t border-border">
              <dl className="divide-y divide-border">
                <FormRow label={tE("hr.entryDate")}>
                  <DatePickerFormField
                    name="startDate"
                    namespace="Employees"
                    width="w-full sm:w-1/2"
                    disabledDate={() => false}
                  />
                </FormRow>
                <FormRow label={tE("hr.exitDate")}>
                  <DatePickerFormField
                    name="endDate"
                    namespace="Employees"
                    width="w-full sm:w-1/2"
                    disabledDate={() => false}
                  />
                </FormRow>
                <FormRow label={tE("hr.probationEndDate")}>
                  <DatePickerFormField
                    name="probationEndDate"
                    namespace="Employees"
                    width="w-full sm:w-1/2"
                    disabledDate={() => false}
                  />
                </FormRow>
                <FormRow label={tE("hr.contractType")}>
                  <SelectFormField
                    name="contractType"
                    options={contractTypeOptions}
                    namespace="Employees"
                    placeholder="selectPlaceholder"
                    width="w-full sm:w-1/2"
                  />
                </FormRow>
                <FormRow label={tE("hr.position")}>
                  <InputFormField name="position" />
                </FormRow>
                <FormRow label={tE("hr.workloadPercent")}>
                  <InputFormField name="workloadPercent" type="number" placeholder="%" />
                </FormRow>
                <FormRow label={tE("hr.weeklyHours")}>
                  <InputFormField name="weeklyHours" placeholder="42.00" />
                </FormRow>
                <FormRow label={tE("hr.grossSalaryMonthly")}>
                  <InputFormField name="grossSalary" type="number" placeholder="CHF" />
                </FormRow>
                <FormRow label={tE("hr.paymentInterval")}>
                  <SelectFormField
                    name="paymentInterval"
                    options={paymentIntervalOptions}
                    namespace="Employees"
                    placeholder="selectPlaceholder"
                    width="w-full sm:w-1/2"
                  />
                </FormRow>
                <FormRow label={tE("hr.has13thSalary")}>
                  <SwitchFormField name="has13thSalary" namespace="Employees" />
                </FormRow>
                <FormRow label={tE("hr.annualVacationDays")}>
                  <InputFormField
                    name="annualVacationDays"
                    type="number"
                    width="w-32"
                  />
                </FormRow>
                <FormRow label={tE("hr.remainingVacationDays")}>
                  <InputFormField
                    name="remainingVacationDays"
                    placeholder="0.00"
                    width="w-32"
                  />
                </FormRow>
                <FormRow label={tE("contract.notes")}>
                  <TextareaFormField name="notes" />
                </FormRow>
                <FormRow label={tE("contract.document")}>
                  <ContractDocumentField
                    name="documentUrl"
                    employeeId={employeeId}
                  />
                </FormRow>
              </dl>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {tE("contract.cancel")}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {tE("contract.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
