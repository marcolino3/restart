"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePermissions } from "@/features/users/context/current-user.context";

import type { StudentRecordEntry } from "../actions/record-entries-actions";
import type { StudentRecordCategory } from "../actions/record-categories-actions";
import { RecordComposer } from "./RecordComposer";
import { RecordTimeline } from "./RecordTimeline";
import { ManageRecordCategoriesDialog } from "./ManageRecordCategoriesDialog";

interface Props {
  studentId: string;
  entries: StudentRecordEntry[];
  categories: StudentRecordCategory[];
}

/**
 * "Förderung" tab body on the student detail page: a compose box, the entry
 * timeline, and (for authorised users) category management. Data is provided by
 * the parent's lazy loader; `router.refresh()` re-runs it after a change.
 */
export function StudentRecordTab({ studentId, entries, categories }: Props) {
  const t = useTranslations("StudentRecords");
  const router = useRouter();
  const { hasPermission } = usePermissions();

  const canWrite = hasPermission("STUDENT_RECORD_WRITE");
  const canDelete = hasPermission("STUDENT_RECORD_DELETE");
  const canManageCategories = hasPermission("STUDENT_RECORD_CATEGORY_WRITE");

  const [composing, setComposing] = useState(false);
  const [managingCategories, setManagingCategories] = useState(false);

  const refresh = () => router.refresh();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-[650] tracking-[-0.01em]">
            {t("title")}
          </h3>
          <p className="text-[12.5px] text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          {canManageCategories && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setManagingCategories(true)}
            >
              <Settings2 className="mr-1.5 h-4 w-4" />
              {t("manageCategories")}
            </Button>
          )}
          {canWrite && !composing && (
            <Button size="sm" onClick={() => setComposing(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              {t("newEntry")}
            </Button>
          )}
        </div>
      </div>

      {canWrite && composing && (
        <div className="rounded-card border bg-card p-4 shadow-xs">
          <RecordComposer
            studentId={studentId}
            categories={categories}
            onSaved={() => {
              setComposing(false);
              refresh();
            }}
            onCancel={() => setComposing(false)}
          />
        </div>
      )}

      <RecordTimeline
        studentId={studentId}
        entries={entries}
        categories={categories}
        canEdit={canWrite}
        canDelete={canDelete}
        onChanged={refresh}
      />

      {managingCategories && (
        <ManageRecordCategoriesDialog
          categories={categories}
          studentId={studentId}
          onClose={() => setManagingCategories(false)}
        />
      )}
    </div>
  );
}
