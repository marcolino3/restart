"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DocumentManager,
  type ManagedDocument,
} from "@/components/common/DocumentManager";
import {
  getStudentRecordDocumentsAction,
  type StudentRecordDocument,
} from "../actions/get-record-documents.action";

interface Props {
  entryId: string;
  canEdit: boolean;
}

/**
 * Documents attached to a single support-record entry. Thin, self-fetching
 * wrapper around the reusable DocumentManager, wired to the
 * `student-record-documents` endpoint scoped by the entry.
 */
export function StudentRecordDocumentsBlock({ entryId, canEdit }: Props) {
  const [documents, setDocuments] = useState<StudentRecordDocument[]>([]);

  const load = useCallback(async () => {
    const res = await getStudentRecordDocumentsAction(entryId);
    if (res.success) setDocuments(res.data);
  }, [entryId]);

  useEffect(() => {
    void load();
  }, [load]);

  const managed: ManagedDocument[] = documents;

  return (
    <DocumentManager
      documents={managed}
      endpoint="student-record-documents"
      uploadQuery={`entryId=${entryId}`}
      canEdit={canEdit}
      onChanged={load}
    />
  );
}
