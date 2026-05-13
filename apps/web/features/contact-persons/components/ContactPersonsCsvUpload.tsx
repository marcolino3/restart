"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Loader2,
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { isExcelFile, xlsxToCsv } from "@/lib/utils/excel-templates";

interface UploadResult {
  created: { name: string }[];
  failed: { name: string; reason: string }[];
}

function downloadTemplate() {
  const headers = [
    "salutation",
    "firstName",
    "lastName",
    "email",
    "phone",
    "mobile",
    "dateOfBirth",
    "occupation",
    "roles",
    "nationalities",
    "preferredLanguages",
    "notes",
  ];
  const example = [
    "MRS",
    "Anna",
    "Mustermann",
    "anna@example.com",
    "+41 31 312 45 67",
    "+41 79 312 45 67",
    "1985-04-12",
    "Lehrerin",
    "MOTHER",
    "CH",
    "de",
    "",
  ];

  const csv = [headers.join(";"), example.join(";")].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bezugspersonen-vorlage.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export const ContactPersonsCsvUpload = () => {
  const t = useTranslations("Common");
  const tC = useTranslations("ContactPersons");
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv") && !isExcelFile(file)) {
      toast.error(t("error"), { description: tC("csvInvalidFormat") });
      return;
    }

    if (isExcelFile(file)) {
      try {
        file = await xlsxToCsv(file);
      } catch {
        toast.error(t("error"), { description: tC("csvInvalidFormat") });
        return;
      }
    }

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/contact-persons/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data: UploadResult = await response.json();
      setResult(data);

      const totalCreated = data.created.length;
      const totalFailed = data.failed.length;

      if (totalFailed === 0) {
        toast.success(t("success"), {
          description: `${totalCreated} ${tC("csvCreated")}`,
        });
      } else {
        toast.warning(tC("csvPartialSuccess"), {
          description: `${totalCreated} ${tC("csvCreated")}, ${totalFailed} ${tC("csvFailed")}`,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          {tC("csvImport")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tC("csvImport")}</DialogTitle>
          <DialogDescription>{tC("csvImportDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Format info */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              CSV Format
            </h4>
            <p className="text-sm text-muted-foreground mb-2">
              {tC("csvFormatInfo")}
            </p>
            <code className="text-xs bg-background p-2 rounded block overflow-x-auto">
              salutation;firstName;lastName;email;phone;mobile;dateOfBirth;occupation;roles;nationalities;preferredLanguages;notes
            </code>
            <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
              <p>
                <strong>salutation:</strong> MR, MRS, DIVERSE, NONE (
                {tC("csvOptional")})
              </p>
              <p>
                <strong>firstName:</strong> {t("firstName")} ({tC("csvRequired")}
                )
              </p>
              <p>
                <strong>lastName:</strong> {t("lastName")} ({tC("csvRequired")})
              </p>
              <p>
                <strong>email:</strong> {tC("email")} ({tC("csvOptional")})
              </p>
              <p>
                <strong>phone:</strong> {tC("phone")} ({tC("csvOptional")})
              </p>
              <p>
                <strong>mobile:</strong> {tC("mobile")} ({tC("csvOptional")})
              </p>
              <p>
                <strong>dateOfBirth:</strong> YYYY-MM-DD ({tC("csvOptional")})
              </p>
              <p>
                <strong>occupation:</strong> {tC("occupation")} (
                {tC("csvOptional")})
              </p>
              <p>
                <strong>roles:</strong> FATHER, MOTHER, STEP_FATHER,
                STEP_MOTHER, GRANDFATHER, GRANDMOTHER, SIBLING, NANNY,
                LEGAL_GUARDIAN, AUNT_UNCLE, OTHER ({tC("csvOptional")})
              </p>
              <p>
                <strong>nationalities:</strong> CH, DE, AT, ... (
                {tC("csvOptional")})
              </p>
              <p>
                <strong>preferredLanguages:</strong> de, en, fr, ... (
                {tC("csvOptional")})
              </p>
              <p>
                <strong>notes:</strong> {tC("notesSection")} (
                {tC("csvOptional")})
              </p>
              <p className="mt-1 italic">{tC("csvPipeInfo")}</p>
            </div>
          </div>

          {/* File input */}
          <div className="flex items-center gap-4">
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

          {/* Template download */}
          <Button
            variant="outline"
            onClick={() => {
              downloadTemplate();
              toast.success(t("success"), {
                description: tC("csvTemplateDownloaded"),
              });
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            {tC("csvDownloadTemplate")}
          </Button>

          {/* Results */}
          {result && (
            <div className="space-y-3">
              {result.created.length > 0 && (
                <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                  <h5 className="font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {tC("csvCreatedTitle")} ({result.created.length})
                  </h5>
                  <ul className="text-sm mt-1 max-h-32 overflow-y-auto">
                    {result.created.map((item, idx) => (
                      <li
                        key={idx}
                        className="text-green-600 dark:text-green-400"
                      >
                        {item.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.failed.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                  <h5 className="font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    {tC("csvFailedTitle")} ({result.failed.length})
                  </h5>
                  <ul className="text-sm mt-1 max-h-32 overflow-y-auto">
                    {result.failed.map((item, idx) => (
                      <li
                        key={idx}
                        className="text-red-600 dark:text-red-400"
                      >
                        {item.name}: {item.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
