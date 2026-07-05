"use client";

import { useState } from "react";
import { MoreHorizontal, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmployeesCsvUpload } from "./EmployeesCsvUpload";

/**
 * Overflow ("…") menu for secondary employee-list actions. Currently holds the
 * CSV import; a home for further bulk/list actions as they get added.
 */
export function EmployeesActionsMenu() {
  const t = useTranslations("Common");
  const tE = useTranslations("Employees");
  const [csvOpen, setCsvOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label={t("openMenu")}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setCsvOpen(true);
            }}
          >
            <Upload className="mr-2 h-4 w-4" />
            {tE("csvImport")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EmployeesCsvUpload open={csvOpen} onOpenChange={setCsvOpen} />
    </>
  );
}
