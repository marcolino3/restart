"use client";

import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { PageActionsMenu } from "@/components/common/PageActionsMenu";

import { StudentImportDialog } from "./StudentImportDialog";

/**
 * Overflow ("…") menu for secondary student-list actions, keeping the page
 * header to one primary button. Add further bulk/list actions here rather
 * than as extra buttons next to the title.
 */
export function StudentsActionsMenu() {
  const tS = useTranslations("Students");
  const [importOpen, setImportOpen] = useState(false);

  return (
    <>
      <PageActionsMenu
        ariaLabel={tS("actionsMenu")}
        actions={[
          {
            id: "student-import",
            label: tS("importTitle"),
            icon: <Upload className="mr-2 size-4" />,
            onSelect: () => setImportOpen(true),
          },
        ]}
      />
      <StudentImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}
