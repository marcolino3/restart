"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

import { useTranslations as useT } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { EditorFormField } from "@/components/form/form-fields/EditorFormField";
import { cn } from "@/lib/utils";

import { previewAdmissionEmailAction } from "../actions/preview-admission-email.action";
import { sendAdmissionEmailAction } from "../actions/send-admission-email.action";

export interface SendableTemplate {
  id: string;
  name: string;
}

export interface SendableContact {
  id: string;
  name: string;
  email: string;
  /** RelationshipType, e.g. FATHER / MOTHER — translated via ContactPersons ns. */
  role: string | null;
}

const Schema = z.object({
  toEmail: z.string().email(),
  toName: z.string().max(200).optional(),
  subject: z.string().min(1).max(300),
  bodyHtml: z.string().min(1),
});

type FormValues = z.infer<typeof Schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  templates: SendableTemplate[];
  contacts: SendableContact[];
  defaultToEmail?: string | null;
  defaultToName?: string | null;
  onSent: () => void;
  /**
   * Prefill from the inline composer's "Vorschau" — the already-picked
   * template plus edited subject/body, so the dialog continues where the
   * inline form left off instead of starting blank.
   */
  initialTemplateId?: string | null;
  initialSubject?: string;
  initialBodyHtml?: string;
}

export function SendEmailDialog({
  open,
  onOpenChange,
  applicationId,
  templates,
  contacts,
  defaultToEmail,
  defaultToName,
  onSent,
  initialTemplateId,
  initialSubject,
  initialBodyHtml,
}: Props) {
  const t = useTranslations("Admissions");
  const tc = useT("ContactPersons");
  const [sending, setSending] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(
    initialTemplateId ?? null,
  );

  // Default the recipient to the contact matching the supplied email, else the
  // first contact — so the highlighted chip and the email field always agree.
  const initialRecipient =
    contacts.find((c) => c.email === defaultToEmail) ?? contacts[0] ?? null;
  const [recipientId, setRecipientId] = useState<string | null>(
    initialRecipient?.id ?? null,
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      toEmail: initialRecipient?.email ?? defaultToEmail ?? "",
      toName: initialRecipient?.name ?? defaultToName ?? "",
      subject: initialSubject ?? "",
      bodyHtml: initialBodyHtml ?? "",
    },
  });

  const onTemplateChange = async (id: string) => {
    setTemplateId(id);
    setLoadingPreview(true);
    const res = await previewAdmissionEmailAction(applicationId, id);
    setLoadingPreview(false);
    if (!res.success) {
      toast.error(res.error ?? t("emailPreviewError"));
      return;
    }
    form.setValue("subject", res.data.subject);
    form.setValue("bodyHtml", res.data.bodyHtml);
    // Only override the recipient from the preview if the user has not already
    // picked one explicitly.
    if (!recipientId) {
      if (res.data.toEmail) form.setValue("toEmail", res.data.toEmail);
      if (res.data.toName) form.setValue("toName", res.data.toName);
    }
  };

  const pickRecipient = (contact: SendableContact) => {
    setRecipientId(contact.id);
    form.setValue("toEmail", contact.email);
    form.setValue("toName", contact.name);
  };

  const roleLabel = (role: string | null): string | null => {
    if (!role) return null;
    const label = tc(role);
    // next-intl returns the key itself for unknown roles — hide those.
    return label === role ? null : label;
  };

  const onSubmit = async (values: FormValues) => {
    setSending(true);
    const res = await sendAdmissionEmailAction({
      applicationId,
      templateId,
      toEmail: values.toEmail.trim(),
      toName: values.toName?.trim() || null,
      subject: values.subject.trim(),
      bodyHtml: values.bodyHtml,
    });
    setSending(false);

    if (!res.success) {
      toast.error(res.error ?? t("emailSendError"));
      return;
    }
    // The mutation succeeds even on a delivery failure (the attempt is tracked);
    // surface the actual SMTP outcome to the user.
    if (res.status === "FAILED") {
      toast.error(t("emailSendFailed"), {
        description: res.errorMessage ?? undefined,
      });
      onSent();
      return;
    }
    toast.success(t("emailSendOk"));
    onOpenChange(false);
    onSent();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("emailSendTitle")}</DialogTitle>
          <DialogDescription>{t("emailSendDescription")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <DialogBody className="space-y-4">
              <div className="space-y-[7px]">
                <Label className="text-[12.5px] font-semibold">
                  {t("emailTemplateLabel")}
                </Label>
          <Select
            value={templateId ?? undefined}
            onValueChange={onTemplateChange}
            disabled={templates.length === 0 || loadingPreview}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  templates.length === 0
                    ? t("emailNoTemplates")
                    : t("emailTemplatePlaceholder")
                }
              />
            </SelectTrigger>
            <SelectContent>
              {templates.map((tpl) => (
                <SelectItem key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {loadingPreview && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t("emailLoadingPreview")}
            </p>
          )}
              </div>

              {contacts.length > 0 && (
              <div className="space-y-[7px]">
                <Label className="text-[12.5px] font-semibold">{t("emailRecipientLabel")}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {contacts.map((contact) => {
                    const role = roleLabel(contact.role);
                    return (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => pickRecipient(contact)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition",
                          recipientId === contact.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:bg-muted",
                        )}
                      >
                        <span className="font-medium">{contact.name}</span>
                        {role && (
                          <span className="text-[10px] opacity-70">
                            {role}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InputFormField
                name="toEmail"
                label="emailTo"
                namespace="Admissions"
                type="email"
                placeholder="parent@example.com"
              />
              <InputFormField
                name="toName"
                label="emailToName"
                namespace="Admissions"
              />
            </div>
            <InputFormField
              name="subject"
              label="emailSubject"
              namespace="Admissions"
            />
            <EditorFormField
              name="bodyHtml"
              label="emailBody"
              namespace="Admissions"
            />
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={sending}
              >
                {t("emailCancel")}
              </Button>
              <Button type="submit" disabled={sending} className="gap-1.5">
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {t("emailSend")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
