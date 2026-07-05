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

interface UploadResult {
  created: { email: string }[];
  failed: { email: string; reason: string }[];
}

function downloadTemplate() {
  const headers = [
    "email",
    "firstName",
    "lastName",
    "title",
    "persona",
    "contactPhone",
    "dateOfBirth",
  ];
  const example = [
    "max@example.com",
    "Max",
    "Mustermann",
    "Herr",
    "EMPLOYEE",
    "+41 79 123 45 67",
    "1990-01-15",
  ];

  const csv = [headers.join(";"), example.join(";")].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mitarbeiter-vorlage.csv";
  a.click();
  URL.revokeObjectURL(url);
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
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = onOpenChange !== undefined;
  const open = isControlled ? !!controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error(t("error"), { description: tE("csvOnlyAllowed") });
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
        throw new Error(`Upload failed: ${response.statusText}`);
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
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tE("csvImport")}</DialogTitle>
          <DialogDescription>{tE("csvImportDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Format info */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              CSV Format
            </h4>
            <p className="text-sm text-muted-foreground mb-2">
              {tE("csvFormatInfo")}
            </p>
            <code className="text-xs bg-background p-2 rounded block overflow-x-auto">
              email;firstName;lastName;title;persona;contactPhone;dateOfBirth
            </code>
            <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
              <p>
                <strong>email:</strong> {t("email")} ({tE("csvRequired")})
              </p>
              <p>
                <strong>firstName:</strong> {t("firstName")} ({tE("csvOptional")}
                )
              </p>
              <p>
                <strong>lastName:</strong> {t("lastName")} ({tE("csvOptional")})
              </p>
              <p>
                <strong>title:</strong> {t("title")} ({tE("csvOptional")})
              </p>
              <p>
                <strong>persona:</strong> ADMIN, HR, OFFICE, TEACHER, EMPLOYEE (
                {tE("csvOptional")})
              </p>
              <p>
                <strong>contactPhone:</strong> {t("phone")} ({tE("csvOptional")}
                )
              </p>
              <p>
                <strong>dateOfBirth:</strong> YYYY-MM-DD ({tE("csvOptional")})
              </p>
            </div>
          </div>

          {/* File input */}
          <div className="flex items-center gap-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
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
      </DialogContent>
    </Dialog>
  );
};
