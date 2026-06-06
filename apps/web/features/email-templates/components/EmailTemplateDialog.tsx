"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Copy, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { EditorFormField } from "@/components/form/form-fields/EditorFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";

import { ADMISSION_EMAIL_PLACEHOLDERS } from "../placeholders";
import {
  createEmailTemplateAction,
  updateEmailTemplateAction,
} from "../actions/mutate-email-template.action";
import type { EmailTemplate } from "../actions/get-email-templates.action";

const Schema = z.object({
  name: z.string().min(1).max(200),
  subject: z.string().min(1).max(300),
  bodyHtml: z.string().min(1),
  description: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof Schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: EmailTemplate | null;
  onSaved: () => void;
}

export function EmailTemplateDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: Props) {
  const t = useTranslations("EmailTemplates");
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial;

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      name: initial?.name ?? "",
      subject: initial?.subject ?? "",
      bodyHtml: initial?.bodyHtml ?? "",
      description: initial?.description ?? "",
    },
  });

  const copyToken = async (token: string) => {
    const snippet = `{{${token}}}`;
    try {
      await navigator.clipboard.writeText(snippet);
      toast.success(t("placeholderCopied", { token: snippet }));
    } catch {
      toast.error(t("placeholderCopyError"));
    }
  };

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    const res = isEdit
      ? await updateEmailTemplateAction({ id: initial!.id, ...values })
      : await createEmailTemplateAction({ ...values, category: "ADMISSION" });
    setSaving(false);
    if (!res.success) {
      toast.error(res.error ?? t(isEdit ? "updateError" : "createError"));
      return;
    }
    toast.success(t(isEdit ? "updateOk" : "createOk"));
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t(isEdit ? "editTitle" : "createTitle")}</DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <InputFormField
              name="name"
              label="name"
              namespace="EmailTemplates"
              placeholder={t("namePlaceholder")}
            />
            <InputFormField
              name="subject"
              label="subject"
              namespace="EmailTemplates"
              placeholder={t("subjectPlaceholder")}
            />

            {/* Placeholder helper — click to copy a token to paste into subject/body. */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {t("placeholderHelp")}
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {ADMISSION_EMAIL_PLACEHOLDERS.map((p) => (
                  <Badge
                    key={p.token}
                    variant="outline"
                    role="button"
                    tabIndex={0}
                    onClick={() => copyToken(p.token)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        copyToken(p.token);
                      }
                    }}
                    className="cursor-pointer gap-1 font-mono text-[11px] hover:bg-muted"
                    title={t(p.labelKey)}
                  >
                    <Copy className="h-3 w-3" />
                    {`{{${p.token}}}`}
                  </Badge>
                ))}
              </div>
            </div>

            <EditorFormField
              name="bodyHtml"
              label="bodyHtml"
              namespace="EmailTemplates"
            />

            <TextareaFormField
              name="description"
              label="description"
              namespace="EmailTemplates"
              placeholder={t("descriptionPlaceholder")}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
