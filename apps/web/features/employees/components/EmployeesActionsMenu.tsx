"use client";

import { FileText, Upload } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ROUTES } from "@/constants/routes";

import { PageActionsMenu } from "@/components/common/PageActionsMenu";

import { EmployeesCsvUpload } from "./EmployeesCsvUpload";

/**
 * Overflow ("…") menu for secondary employee-list actions. Currently holds the
 * CSV import; a home for further bulk/list actions as they get added.
 */
export function EmployeesActionsMenu() {
  const tE = useTranslations("Employees");
  const locale = useLocale();
  const router = useRouter();
  const [csvOpen, setCsvOpen] = useState(false);

  return (
    <>
      <PageActionsMenu
        actions={[
          {
            id: "csv-import",
            label: tE("csvImport"),
            icon: <Upload className="mr-2 size-4" />,
            onSelect: () => setCsvOpen(true),
          },
          {
            id: "contract-templates",
            label: tE("contractTemplates"),
            icon: <FileText className="mr-2 size-4" />,
            onSelect: () =>
              router.push(ROUTES.admin.employeesContractTemplates(locale)),
          },
        ]}
      />
      <EmployeesCsvUpload open={csvOpen} onOpenChange={setCsvOpen} />
    </>
  );
}
