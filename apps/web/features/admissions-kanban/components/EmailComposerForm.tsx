"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Eye, Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
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

import { previewAdmissionEmailAction } from "../actions/preview-admission-email.action";
import { sendAdmissionEmailAction } from "../actions/send-admission-email.action";
import type {
  SendableContact,
  SendableTemplate,
} from "./SendEmailDialog";

/** Snapshot of the composer state handed to the full dialog on "Vorschau". */
export interface EmailComposerDraft {
  templateId: string | null;
  toEmail: string;
  toName: string;
  subject: string;
  bodyHtml: string;
}

interface Props {
  applicationId: string;
  templates: SendableTemplate[];
  contacts: SendableContact[];
  onSent: () => void;
  /** Open the full SendEmailDialog prefilled with the current draft. */
  onPreview: (draft: EmailComposerDraft) => void;
}

const Schema = z.object({
  toEmail: z.string().email(),
  toName: z.string().max(200).optional(),
  subject: z.string().min(1).max(300),
  bodyHtml: z.string().min(1),
});

type FormValues = z.infer<typeof Schema>;

/**
 * Inline "E-Mail" tab of the activity composer (design BF): template + recipient
 * side by side, subject, an editable body, and Vorschau/Senden actions. Reuses
 * the admissions email actions; "Vorschau" hands the current draft to the full
 * SendEmailDialog for fine control.
 */
export function EmailComposerForm({
  applicationId,
  templates,
  contacts,
  onSent,
  onPreview,
}: Props) {
  const t = useTranslations("Admissions");
  const tc = useTranslations("ContactPersons");
  const [sending, setSending] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);

  const initialRecipient = contacts[0] ?? null;
  const [recipientId, setRecipientId] = useState<string | null>(
    initialRecipient?.id ?? null,
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      toEmail: initialRecipient?.email ?? "",
      toName: initialRecipient?.name ?? "",
      subject: "",
      bodyHtml: "",
    },
  });

  const roleLabel = (role: string | null): string | null => {
    if (!role) return null;
    const label = tc(role);
    return label === role ? null : label;
  };

  /** "Name (Rolle) — email" for the recipient select option. */
  const contactLabel = (c: SendableContact): string => {
    const role = roleLabel(c.role);
    return `${c.name}${role ? ` (${role})` : ""} — ${c.email}`;
  };

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
  };

  const onRecipientChange = (id: string) => {
    const contact = contacts.find((c) => c.id === id);
    if (!contact) return;
    setRecipientId(id);
    form.setValue("toEmail", contact.email);
    form.setValue("toName", contact.name);
  };

  const openPreview = () => {
    const v = form.getValues();
    onPreview({
      templateId,
      toEmail: v.toEmail,
      toName: v.toName ?? "",
      subject: v.subject,
      bodyHtml: v.bodyHtml,
    });
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
    if (res.status === "FAILED") {
      toast.error(t("emailSendFailed"), {
        description: res.errorMessage ?? undefined,
      });
      onSent();
      return;
    }
    toast.success(t("emailSendOk"));
    form.reset({ toEmail: "", toName: "", subject: "", bodyHtml: "" });
    setTemplateId(null);
    onSent();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
          {/* Vorlage */}
          <div className="space-y-[7px]">
            <Label className="text-[12.5px] font-semibold">
              {t("emailTemplateLabel")}
            </Label>
            <Select
              value={templateId ?? undefined}
              onValueChange={onTemplateChange}
              disabled={templates.length === 0 || loadingPreview}
            >
              <SelectTrigger className="rounded-ctl!">
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
          </div>

          {/* An */}
          <div className="space-y-[7px]">
            <Label className="text-[12.5px] font-semibold">
              {t("emailRecipientLabel")}
            </Label>
            <Select
              value={recipientId ?? undefined}
              onValueChange={onRecipientChange}
              disabled={contacts.length === 0}
            >
              <SelectTrigger className="rounded-ctl!">
                <SelectValue placeholder={t("emailRecipientPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {contactLabel(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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

        {loadingPreview && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t("emailLoadingPreview")}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openPreview}
            disabled={sending}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            {t("emailPreview")}
          </Button>
          <Button type="submit" size="sm" disabled={sending} className="gap-1.5">
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {t("emailSend")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
