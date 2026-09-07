"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Download,
  FileText,
  Loader2,
  Lock,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  buildEmployeeImportTemplate,
  EMPLOYEE_IMPORT_COLUMNS,
  EMPLOYEE_IMPORT_GROUPS,
  type EmployeeImportGroup,
} from "../employee-import-columns";

interface UploadResult {
  created: { email: string; warnings?: string[] }[];
  failed: { email: string; reason: string }[];
}

const ALLOWED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

const GROUP_LABEL_KEY: Record<EmployeeImportGroup, string> = {
  person: "csvGroupPerson",
  hr: "csvGroupHr",
  emergency: "csvGroupEmergency",
  contract: "csvGroupContract",
  team: "csvGroupTeam",
};

function downloadTemplate() {
  const csv = buildEmployeeImportTemplate();
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mitarbeiter-vorlage.csv";
  a.click();
  URL.revokeObjectURL(url);
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    const message = Array.isArray(body.message)
      ? body.message.join(", ")
      : body.message;
    if (message) return message;
  } catch {
    // Not JSON — fall through to the status text.
  }
  return `${response.status} ${response.statusText}`;
}

interface EmployeesCsvUploadProps {
  /**
   * Controlled open state. When `onOpenChange` is provided the component drops
   * its own trigger button and is driven from outside (e.g. the actions menu).
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const EmployeesCsvUpload = ({
  open: controlledOpen,
  onOpenChange,
}: EmployeesCsvUploadProps = {}) => {
  const t = useTranslations("Common");
  const tE = useTranslations("Employees");
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = onOpenChange !== undefined;
  const open = isControlled ? !!controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    if (!ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) {
      toast.error(t("error"), { description: tE("csvInvalidFormat") });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/employees/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const data: UploadResult = await response.json();
      setResult(data);

      const totalCreated = data.created.length;
      const totalFailed = data.failed.length;

      if (totalFailed === 0) {
        toast.success(t("success"), {
          description: `${totalCreated} ${tE("csvCreated")}`,
        });
      } else {
        toast.warning(tE("csvPartialSuccess"), {
          description: `${totalCreated} ${tE("csvCreated")}, ${totalFailed} ${tE("csvFailed")}`,
        });
      }

      router.refresh();
    } catch (error) {
      console.error("CSV upload error:", error);
      toast.error(t("error"), {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const withWarnings = result?.created.filter(
    (item) => item.warnings && item.warnings.length > 0,
  ) ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            {tE("csvImport")}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{tE("csvImport")}</DialogTitle>
          <DialogDescription>{tE("csvImportDescription")}</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-4">
            {/* Format info */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {tE("csvColumnsTitle")}
              </h4>
              <p className="text-sm text-muted-foreground">
                {tE("csvFormatInfo")}
              </p>
              <p className="text-xs text-muted-foreground">
                {tE("csvColumnsHint")}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" />
                {tE("csvProtectedHint")}
              </p>
              <p className="text-xs text-muted-foreground">
                {tE("csvFileAllowed")}
              </p>

              <Collapsible open={columnsOpen} onOpenChange={setColumnsOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2"
                    aria-expanded={columnsOpen}
                  >
                    <ChevronDown
                      className={`mr-1 h-4 w-4 transition-transform ${columnsOpen ? "rotate-180" : ""}`}
                    />
                    {tE("csvColumnsTitle")} ({EMPLOYEE_IMPORT_COLUMNS.length})
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 space-y-3 max-h-64 overflow-y-auto pr-2">
                    {EMPLOYEE_IMPORT_GROUPS.map((group) => (
                      <div key={group}>
                        <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                          {tE(GROUP_LABEL_KEY[group])}
                        </h5>
                        <dl className="grid grid-cols-[minmax(0,12rem)_1fr] gap-x-3 gap-y-0.5 text-xs">
                          {EMPLOYEE_IMPORT_COLUMNS.filter(
                            (c) => c.group === group,
                          ).map((c) => (
                            <div key={c.key} className="contents">
                              <dt className="font-mono truncate flex items-center gap-1">
                                {c.key}
                                {c.isProtected && (
                                  <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                                )}
                              </dt>
                              <dd className="text-muted-foreground">
                                {tE(`csvColumns.${c.key}`)}{" "}
                                <span className="italic">
                                  (
                                  {c.required
                                    ? tE("csvRequired")
                                    : tE("csvOptional")}
                                  )
                                </span>
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* File input */}
            <div className="flex items-center gap-4">
              <Input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_EXTENSIONS.join(",")}
                onChange={handleFileChange}
                disabled={isUploading}
                className="flex-1"
              />
              {isUploading && <Loader2 className="h-5 w-5 animate-spin" />}
            </div>

            {/* Template download */}
            <Button
              variant="outline"
              onClick={() => {
                downloadTemplate();
                toast.success(t("success"), {
                  description: tE("csvTemplateDownloaded"),
                });
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              {tE("csvDownloadTemplate")}
            </Button>

            {/* Results */}
            {result && (
              <div className="space-y-3">
                {result.created.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                    <h5 className="font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      {tE("csvCreatedTitle")} ({result.created.length})
                    </h5>
                    <ul className="text-sm mt-1 max-h-32 overflow-y-auto">
                      {result.created.map((item, idx) => (
                        <li
                          key={idx}
                          className="text-green-600 dark:text-green-400"
                        >
                          {item.email}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {withWarnings.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg">
                    <h5 className="font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      {tE("csvWarningsTitle")} ({withWarnings.length})
                    </h5>
                    <ul className="text-sm mt-1 max-h-32 overflow-y-auto">
                      {withWarnings.map((item) => (
                        <li
                          key={item.email}
                          className="text-amber-700 dark:text-amber-300"
                        >
                          {item.email}: {item.warnings?.join("; ")}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.failed.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                    <h5 className="font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      {tE("csvFailedTitle")} ({result.failed.length})
                    </h5>
                    <ul className="text-sm mt-1 max-h-32 overflow-y-auto">
                      {result.failed.map((item, idx) => (
                        <li
                          key={idx}
                          className="text-red-600 dark:text-red-400"
                        >
                          {item.email}: {item.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};
