"use client";

import { useTranslations } from "next-intl";
import { Paperclip } from "lucide-react";

import {
  DocumentManager,
  type ManagedDocument,
} from "@/components/common/DocumentManager";

import type { AdmissionDocument } from "../actions/get-admission-documents.action";

interface Props {
  applicationId: string;
  documents: AdmissionDocument[];
  canEdit: boolean;
  onChanged: () => void;
}

/**
 * Documents block on the admission detail page. Thin wrapper around the reusable
 * DocumentManager, wired to the `admission-documents` endpoint scoped by the
 * application.
 */
export function AdmissionDocumentsBlock({
  applicationId,
  documents,
  canEdit,
  onChanged,
}: Props) {
  const t = useTranslations("Admissions");
  const managed: ManagedDocument[] = documents;

  return (
    <section className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("documents")}
          </span>
          {documents.length > 0 && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
              {documents.length}
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <DocumentManager
          documents={managed}
          endpoint="admission-documents"
          uploadQuery={`applicationId=${applicationId}`}
          canEdit={canEdit}
          onChanged={onChanged}
        />
      </div>
    </section>
  );
}
