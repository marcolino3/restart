"use client";

import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { PageActionsMenu } from "@/components/common/PageActionsMenu";

import { StudentsCsvUpload } from "./StudentsCsvUpload";

/**
 * Overflow ("…") menu for secondary student-list actions, keeping the page
 * header to one primary button. Add further bulk/list actions here rather
 * than as extra buttons next to the title.
 */
export function StudentsActionsMenu() {
  const tS = useTranslations("Students");
  const [csvOpen, setCsvOpen] = useState(false);

  return (
    <>
      <PageActionsMenu
        actions={[
          {
            id: "csv-import",
            label: tS("csvImport"),
            icon: <Upload className="mr-2 size-4" />,
            onSelect: () => setCsvOpen(true),
          },
        ]}
      />
      <StudentsCsvUpload open={csvOpen} onOpenChange={setCsvOpen} />
    </>
  );
}
