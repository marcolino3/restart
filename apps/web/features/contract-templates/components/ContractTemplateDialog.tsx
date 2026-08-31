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
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { EditorFormField } from "@/components/form/form-fields/EditorFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";

import { CONTRACT_TEMPLATE_PLACEHOLDERS } from "../placeholders";
import {
  createContractTemplateAction,
  updateContractTemplateAction,
} from "../actions/mutate-contract-template.action";
import type { ContractTemplate } from "../actions/get-contract-templates.action";

const Schema = z.object({
  name: z.string().min(1).max(200),
  bodyHtml: z.string().min(1),
  headerHtml: z.string().optional(),
  footerHtml: z.string().optional(),
  showLogo: z.boolean(),
  description: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof Schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: ContractTemplate | null;
  onSaved: () => void;
}

export function ContractTemplateDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: Props) {
  const t = useTranslations("ContractTemplates");
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial;

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      name: initial?.name ?? "",
      bodyHtml: initial?.bodyHtml ?? "",
      headerHtml: initial?.headerHtml ?? "",
      footerHtml: initial?.footerHtml ?? "",
      showLogo: initial?.showLogo ?? true,
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
    const payload = {
      name: values.name,
      bodyHtml: values.bodyHtml,
      headerHtml: values.headerHtml || null,
      footerHtml: values.footerHtml || null,
      showLogo: values.showLogo,
      description: values.description || null,
    };
    const res = isEdit
      ? await updateContractTemplateAction({ id: initial!.id, ...payload })
      : await createContractTemplateAction(payload);
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
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t(isEdit ? "editTitle" : "createTitle")}</DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <DialogBody className="space-y-4">
              <InputFormField
                name="name"
                label="name"
                namespace="ContractTemplates"
                placeholder={t("namePlaceholder")}
              />

              {/* Placeholder helper — click to copy a token to paste into the editors. */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {t("placeholderHelp")}
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {CONTRACT_TEMPLATE_PLACEHOLDERS.map((p) => (
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
                name="headerHtml"
                label="headerHtml"
                namespace="ContractTemplates"
              />

              <EditorFormField
                name="bodyHtml"
                label="bodyHtml"
                namespace="ContractTemplates"
              />

              <EditorFormField
                name="footerHtml"
                label="footerHtml"
                namespace="ContractTemplates"
              />

              <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    {t("showLogoLabel")}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t("showLogoHint")}
                  </p>
                </div>
                <Switch
                  // eslint-disable-next-line react-hooks/incompatible-library -- React Hook Form returns non-memoizable functions by design
                  checked={form.watch("showLogo")}
                  onCheckedChange={(v) => form.setValue("showLogo", v)}
                />
              </div>

              <TextareaFormField
                name="description"
                label="description"
                namespace="ContractTemplates"
                placeholder={t("descriptionPlaceholder")}
              />
            </DialogBody>

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
