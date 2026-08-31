"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  CheckCircle,
  Download,
  FileText,
  Loader2,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { importStudentsAction } from "../actions/import-students.action";
import { downloadStudentImportTemplate } from "../lib/student-import-template";
import type {
  StudentImportIssue,
  StudentImportMode,
  StudentImportPlan,
} from "../types/student-import";

interface StudentImportDialogProps {
  /** Controlled mode, so the actions menu can own the trigger. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function StudentImportDialog({
  open: controlledOpen,
  onOpenChange,
}: StudentImportDialogProps = {}) {
  const t = useTranslations("Students");
  const tCommon = useTranslations("Common");
  const tContacts = useTranslations("ContactPersons");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = onOpenChange !== undefined;
  const open = isControlled ? !!controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const [isUploading, setIsUploading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [plan, setPlan] = useState<StudentImportPlan | null>(null);
  const [mode, setMode] = useState<StudentImportMode>("SKIP_EXISTING");

  const reset = () => {
    setPlan(null);
    setMode("SKIP_EXISTING");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const contactsByTempId = useMemo(() => {
    const map = new Map<string, StudentImportPlan["contacts"][number]>();
    for (const contact of plan?.contacts ?? []) map.set(contact.tempId, contact);
    return map;
  }, [plan]);

  const issuesByRow = useMemo(() => {
    const map = new Map<number, StudentImportIssue[]>();
    for (const issue of plan?.issues ?? []) {
      if (issue.rowNumber == null) continue;
      const list = map.get(issue.rowNumber) ?? [];
      list.push(issue);
      map.set(issue.rowNumber, list);
    }
    return map;
  }, [plan]);

  const globalIssues = useMemo(
    () => (plan?.issues ?? []).filter((i) => i.rowNumber == null),
    [plan],
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExts = [".xlsx", ".xls", ".csv"];
    if (!validExts.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      toast.error(t("importInvalidFormat"));
      return;
    }

    setIsUploading(true);
    setPlan(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/students/import/preview", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(body?.message ?? `Upload failed: ${res.statusText}`);
      }
      setPlan((await res.json()) as StudentImportPlan);
    } catch (err) {
      toast.error(t("importPreviewError"), {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCommit = async () => {
    if (!plan) return;
    setIsCommitting(true);
    try {
      const result = await importStudentsAction(plan, mode);
      if (!result.success) {
        toast.error(t("importCommitError"), {
          description: result.error ? String(result.error) : undefined,
        });
        return;
      }
      toast.success(t("importCommitted"), {
        description: t("importSummary", {
          created: result.data.createdStudents,
          updated: result.data.updatedStudents,
          skipped: result.data.skippedStudents,
          contacts: result.data.createdContacts,
        }),
      });
      router.refresh();
      setOpen(false);
      reset();
    } finally {
      setIsCommitting(false);
    }
  };

  const hasErrors = (plan?.stats.errorCount ?? 0) > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (isCommitting || isUploading) return;
        setOpen(o);
        if (!o) reset();
      }}
    >
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            {t("importTitle")}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>{t("importTitle")}</DialogTitle>
          <DialogDescription>{t("importDescription")}</DialogDescription>
        </DialogHeader>

        <DialogBody>
          {!plan && (
            <div className="space-y-3">
              <div className="bg-muted space-y-2 rounded-lg p-4 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <FileText className="h-4 w-4" />
                  {t("importExpectedColumns")}
                </div>
                <code className="bg-background block overflow-x-auto rounded p-2 text-xs">
                  {t("importColumnsChild")}
                </code>
                <code className="bg-background block overflow-x-auto rounded p-2 text-xs">
                  {t("importColumnsContacts")}
                </code>
                <p className="text-muted-foreground text-xs">
                  {t("importFormatHint")}
                </p>
                <p className="text-muted-foreground text-xs">
                  {t("importSiblingHint")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="flex-1"
                />
                {isUploading && <Loader2 className="h-5 w-5 animate-spin" />}
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  downloadStudentImportTemplate();
                  toast.success(t("importTemplateDownloaded"));
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                {t("importDownloadTemplate")}
              </Button>
            </div>
          )}

          {plan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-5">
                <Stat label={t("importStatRows")} value={plan.stats.rowCount} />
                <Stat
                  label={t("importStatNewStudents")}
                  value={plan.stats.newStudentCount}
                />
                <Stat
                  label={t("importStatExistingStudents")}
                  value={plan.stats.existingStudentCount}
                />
                <Stat
                  label={t("importStatContacts")}
                  value={plan.contacts.length}
                  hint={
                    plan.stats.mergedContactCount > 0
                      ? t("importStatMerged", {
                          count: plan.stats.mergedContactCount,
                        })
                      : undefined
                  }
                />
                <Stat
                  label={t("importStatFamilies")}
                  value={plan.stats.familyCount}
                />
              </div>

              {globalIssues.length > 0 && (
                <IssueList issues={globalIssues} />
              )}

              {plan.stats.existingStudentCount > 0 && (
                <div className="space-y-2 rounded-lg border p-3">
                  <p className="text-sm font-medium">
                    {t("importExistingFound", {
                      count: plan.stats.existingStudentCount,
                    })}
                  </p>
                  <RadioGroup
                    value={mode}
                    onValueChange={(v) => setMode(v as StudentImportMode)}
                    className="gap-2"
                  >
                    <div className="flex items-start gap-2">
                      <RadioGroupItem
                        value="SKIP_EXISTING"
                        id="import-mode-skip"
                        className="mt-1"
                      />
                      <Label
                        htmlFor="import-mode-skip"
                        className="flex-col items-start gap-0.5 font-normal"
                      >
                        <span className="font-medium">
                          {t("importModeSkip")}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {t("importModeSkipHint")}
                        </span>
                      </Label>
                    </div>
                    <div className="flex items-start gap-2">
                      <RadioGroupItem
                        value="UPDATE_EXISTING"
                        id="import-mode-update"
                        className="mt-1"
                      />
                      <Label
                        htmlFor="import-mode-update"
                        className="flex-col items-start gap-0.5 font-normal"
                      >
                        <span className="font-medium">
                          {t("importModeUpdate")}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {t("importModeUpdateHint")}
                        </span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              <div className="max-h-80 overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        {t("importColumnRow")}
                      </TableHead>
                      <TableHead>{t("importColumnStudent")}</TableHead>
                      <TableHead>{t("importColumnClass")}</TableHead>
                      <TableHead>{t("importColumnContacts")}</TableHead>
                      <TableHead>{t("importColumnStatus")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plan.students.map((student) => {
                      const rowIssues =
                        issuesByRow.get(student.sourceRowNumber) ?? [];
                      const hasError = rowIssues.some(
                        (i) => i.severity === "ERROR",
                      );
                      return (
                        <TableRow key={student.tempId}>
                          <TableCell className="text-muted-foreground text-xs">
                            {student.sourceRowNumber}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {student.firstName} {student.lastName}
                            </div>
                            {student.dateOfBirth && (
                              <div className="text-muted-foreground text-xs">
                                {student.dateOfBirth}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {student.schoolClassId ? (
                              student.schoolClassName
                            ) : student.schoolClassName ? (
                              <span className="text-amber-600 dark:text-amber-400">
                                {student.schoolClassName}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {student.links.map((link) => {
                                const contact = contactsByTempId.get(
                                  link.contactTempId,
                                );
                                if (!contact) return null;
                                return (
                                  <Badge
                                    key={link.contactTempId}
                                    variant="secondary"
                                    className="font-normal"
                                  >
                                    {tContacts(link.relationshipType)}
                                    : {contact.firstName} {contact.lastName}
                                    {contact.sourceRowNumbers.length > 1 && (
                                      <Users className="ml-1 h-3 w-3" />
                                    )}
                                  </Badge>
                                );
                              })}
                              {student.links.length === 0 && (
                                <span className="text-muted-foreground text-xs">
                                  —
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {hasError ? (
                              <Badge variant="destructive">
                                {t("importStatusError")}
                              </Badge>
                            ) : student.existingStudentId ? (
                              <Badge variant="outline">
                                {mode === "UPDATE_EXISTING"
                                  ? t("importStatusUpdate")
                                  : t("importStatusSkip")}
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                {t("importStatusNew")}
                              </Badge>
                            )}
                            {rowIssues.length > 0 && (
                              <IssueList issues={rowIssues} compact />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          {plan && (
            <Button variant="outline" onClick={reset} disabled={isCommitting}>
              {tCommon("back")}
            </Button>
          )}
          <Button
            onClick={handleCommit}
            disabled={!plan || isCommitting || hasErrors}
          >
            {isCommitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("importing")}
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                {t("importCommit")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="bg-muted rounded p-2">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
      {hint && <div className="text-muted-foreground text-[11px]">{hint}</div>}
    </div>
  );
}

function IssueList({
  issues,
  compact = false,
}: {
  issues: StudentImportIssue[];
  compact?: boolean;
}) {
  const t = useTranslations("Students");
  return (
    <ul className={compact ? "mt-1 space-y-0.5" : "space-y-1 rounded-lg border p-3"}>
      {issues.map((issue, i) => (
        <li
          key={i}
          className={`flex items-start gap-1.5 text-xs ${
            issue.severity === "ERROR"
              ? "text-destructive"
              : "text-amber-700 dark:text-amber-400"
          }`}
        >
          {issue.severity === "ERROR" ? (
            <XCircle className="mt-0.5 h-3 w-3 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          )}
          <span>
            {t(`importIssue.${issue.code}`, {
              value: issue.value ?? "",
              rows: (issue.relatedRowNumbers ?? []).join(", "),
            })}
          </span>
        </li>
      ))}
    </ul>
  );
}
