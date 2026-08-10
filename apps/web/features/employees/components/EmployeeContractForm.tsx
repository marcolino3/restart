"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FieldResourceProvider } from "@/components/form/field-resource-context";
import { handleAction } from "@/lib/actions/handle-action";
import { ROUTES } from "@/constants/routes";
import { usePermissions } from "@/features/users/context/current-user.context";
import { CONTRACT_TYPE_DEPENDENT_FIELDS } from "@restart/shared-schemas/employees/contract-type-rules";

import type { EmployeeContract } from "../actions/employee-contracts.actions";
import { saveEmployeeContractAction } from "../actions/employee-contracts.actions";
import {
  buildEmployeeContractFormSchema,
  type EmployeeContractFormOutput,
  type EmployeeContractFormType,
} from "../schemas/employee-contract-form.schema";
import { ContractDocumentField } from "./ContractDocumentField";
import { ContractFormFields } from "./ContractFormFields";
import { ContractSummaryAside } from "./ContractSummaryAside";

function mapWeekdayTimeWindows(
  raw?: EmployeeContract["weekdayTimeWindows"],
): EmployeeContractFormType["weekdayTimeWindows"] {
  if (!raw) return {};
  const keys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
  const out: NonNullable<EmployeeContractFormType["weekdayTimeWindows"]> = {};
  for (const key of keys) {
    const windows = raw[key];
    if (windows?.length) out[key] = windows;
  }
  return out;
}

export function buildContractFormDefaults(
  employeeId: string,
  contract: EmployeeContract | null,
): EmployeeContractFormType {
  return {
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
    hourlyRate: contract?.hourlyRate ?? null,
    paymentInterval: contract?.paymentInterval ?? undefined,
    has13thSalary: contract?.has13thSalary ?? false,
    annualVacationDays: contract?.annualVacationDays ?? null,
    remainingVacationDays: contract?.remainingVacationDays ?? "",
    notes: contract?.notes ?? "",
    documentUrl: contract?.documentUrl ?? "",
    weekdayTimeWindows: mapWeekdayTimeWindows(contract?.weekdayTimeWindows),
    weekdayWorkloads: contract?.weekdayWorkloads ?? {},
  };
}

interface Props {
  employeeId: string;
  contract?: EmployeeContract | null;
  functionOptions?: { label: string; value: string }[];
  firstName?: string | null;
  lastName?: string | null;
  title: string;
  /** Override redirect after save/cancel (defaults to employee contracts tab). */
  returnHref?: string;
}

export function EmployeeContractForm({
  employeeId,
  contract = null,
  functionOptions,
  firstName,
  lastName,
  title,
  returnHref,
}: Props) {
  const t = useTranslations("Common");
  const tE = useTranslations("Employees");
  const locale = useLocale();
  const router = useRouter();

  const backHref =
    returnHref ??
    `${ROUTES.admin.employeesView(locale, employeeId)}?tab=contracts`;

  const { canReadField } = usePermissions();
  const schema = useMemo(() => {
    const hiddenByPermission = new Set(
      CONTRACT_TYPE_DEPENDENT_FIELDS.filter(
        (field) => !canReadField("employeeContract", field),
      ),
    );
    return buildEmployeeContractFormSchema(hiddenByPermission);
     
  }, [canReadField]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: buildContractFormDefaults(employeeId, contract),
  });

  const goBack = () => {
    router.push(backHref);
  };

  const onValid = async (values: EmployeeContractFormOutput) => {
    await handleAction({
      action: () => saveEmployeeContractAction(values),
      successMessage: contract ? tE("contract.updated") : tE("contract.created"),
      errorMessage: tE("contract.saveError"),
      onSuccess: goBack,
    });
  };

  const submitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(
          (values) => onValid(values as EmployeeContractFormOutput),
          (errors) => {
            console.warn("Contract validation errors:", errors);
            const first = Object.values(errors)[0];
            const detail =
              first && typeof first === "object" && "message" in first
                ? String(first.message)
                : undefined;
            toast.error(tE("validationError"), {
              description: detail,
            });
          },
        )}
        className="space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{title}</h1>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={submitting}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {t("save")}
            </Button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <FieldResourceProvider resource="employeeContract" mode={contract ? "update" : "create"}>
            <ContractFormFields
              functionOptions={functionOptions}
              showContractExtras
              documentSlot={
                <ContractDocumentField
                  name="documentUrl"
                  employeeId={employeeId}
                />
              }
            />
            <ContractSummaryAside
              firstName={firstName}
              lastName={lastName}
              functionOptions={functionOptions}
            />
          </FieldResourceProvider>
        </div>
      </form>
    </Form>
  );
}
