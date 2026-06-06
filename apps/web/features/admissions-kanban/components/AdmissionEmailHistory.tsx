"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Mail,
  RefreshCw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { cn } from "@/lib/utils";
import type { AdmissionEmail } from "../actions/get-admission-emails.action";
import {
  deleteAdmissionEmailAction,
  resendAdmissionEmailAction,
} from "../actions/mutate-admission-email.action";

interface Props {
  applicationId: string;
  emails: AdmissionEmail[];
  canManage: boolean;
  onChanged: () => void;
}

export function AdmissionEmailHistory({
  applicationId,
  emails,
  canManage,
  onChanged,
}: Props) {
  const t = useTranslations("Admissions");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const onResend = (email: AdmissionEmail) => {
    setResendingId(email.id);
    startTransition(async () => {
      const res = await resendAdmissionEmailAction(email.id, applicationId);
      setResendingId(null);
      if (!res.success) {
        toast.error(res.error ?? t("emailSendError"));
      } else if (res.status === "FAILED") {
        toast.error(t("emailSendFailed"), {
          description: res.errorMessage ?? undefined,
        });
      } else {
        toast.success(t("emailSendOk"));
      }
      onChanged();
    });
  };

  if (emails.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <Mail className="mx-auto h-7 w-7 text-muted-foreground" />
        <p className="mt-2 text-sm italic text-muted-foreground">
          {t("emailHistoryEmpty")}
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {emails.map((email) => {
        const failed = email.status === "FAILED";
        const expanded = expandedId === email.id;
        return (
          <li
            key={email.id}
            className={cn(
              "rounded-lg border bg-card shadow-sm",
              failed && "border-destructive/40",
            )}
          >
            <div className="flex items-start gap-3 p-3">
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : email.id)}
                className="flex min-w-0 flex-1 items-start gap-3 text-left"
              >
                <span className="mt-0.5 shrink-0">
                  {failed ? (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {email.subject}
                    </span>
                    <Badge
                      variant={failed ? "destructive" : "secondary"}
                      className="shrink-0 text-[10px]"
                    >
                      {t(failed ? "emailStatusFailed" : "emailStatusSent")}
                    </Badge>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {t("emailTo")}: {email.toName ?? email.toEmail}
                    {email.toName ? ` <${email.toEmail}>` : ""}
                  </div>
                  {/* Always show who sent it + when. */}
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {new Date(email.sentAt).toLocaleString("de-CH")}
                    {" · "}
                    {t("emailSentBy", {
                      name: email.sentByName ?? t("emailUnknownSender"),
                    })}
                    {email.templateName ? ` · ${email.templateName}` : ""}
                  </div>
                  {failed && email.errorMessage && (
                    <div className="mt-1 text-xs text-destructive">
                      {email.errorMessage}
                    </div>
                  )}
                </div>
                <span className="shrink-0 text-muted-foreground">
                  {expanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </span>
              </button>

              {canManage && (
                <div className="flex shrink-0 items-center gap-1">
                  {failed && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs"
                      disabled={resendingId === email.id}
                      onClick={() => onResend(email)}
                    >
                      {resendingId === email.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      {t("emailResend")}
                    </Button>
                  )}
                  <DeleteConfirmationDialog
                    itemName={email.subject}
                    onConfirm={async () => {
                      const res = await deleteAdmissionEmailAction(
                        email.id,
                        applicationId,
                      );
                      return {
                        success: res.success,
                        error: res.success ? undefined : res.error,
                      };
                    }}
                    onSuccess={onChanged}
                  />
                </div>
              )}
            </div>

            {expanded && (
              <div className="border-t p-3">
                {/* Sandboxed: no scripts can run, even though the body is
                    already backend-sanitized. Avoids dangerouslySetInnerHTML. */}
                <iframe
                  title={t("emailBodyPreview")}
                  sandbox=""
                  className="h-64 w-full rounded-md border bg-white"
                  srcDoc={email.bodyHtml}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
