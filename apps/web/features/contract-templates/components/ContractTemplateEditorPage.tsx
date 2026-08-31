"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, Copy, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { EditorFormField } from "@/components/form/form-fields/EditorFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { ROUTES } from "@/constants/routes";

import { CONTRACT_TEMPLATE_PLACEHOLDERS } from "../placeholders";
import {
  createContractTemplateAction,
  updateContractTemplateAction,
} from "../actions/mutate-contract-template.action";
import { generateContractTemplateAiDraftAction } from "../actions/contract-ai.action";
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
  initial?: ContractTemplate | null;
  aiConfigured: boolean;
}

export function ContractTemplateEditorPage({ initial, aiConfigured }: Props) {
  const t = useTranslations("ContractTemplates");
  const locale = useLocale();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [aiInstructions, setAiInstructions] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const isEdit = !!initial;
  const listUrl = ROUTES.admin.employeesContractTemplates(locale);

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

  const runAiDraft = async () => {
    setAiLoading(true);
    const res = await generateContractTemplateAiDraftAction(aiInstructions);
    setAiLoading(false);
    if (!res.success) {
      toast.error(res.error?.split("{")[0].trim() || t("aiDraftError"));
      return;
    }
    form.setValue("bodyHtml", res.html, {
      shouldDirty: true,
      shouldValidate: true,
    });
    toast.success(t("aiDraftOk"));
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
    router.push(listUrl);
    router.refresh();
  };

  const onInvalid = () => {
    toast.error(t("validationError"));
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-1 h-7 gap-1 px-2 text-xs"
            onClick={() => router.push(listUrl)}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("backToList")}
          </Button>
          <h1 className="text-xl font-semibold">
            {t(isEdit ? "editTitle" : "createTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("dialogDescription")}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, onInvalid)}
            className="min-w-0 space-y-4"
          >
            <InputFormField
              name="name"
              label="name"
              namespace="ContractTemplates"
              placeholder={t("namePlaceholder")}
            />

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

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(listUrl)}
                disabled={saving}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                {t("save")}
              </Button>
            </div>
          </form>
        </Form>

        {/* Sidebar scrolls with the page (sticky) */}
        <aside className="space-y-4 lg:sticky lg:top-16 lg:self-start">
          <div className="space-y-2 rounded-md border p-3">
            <Label className="text-xs text-muted-foreground">
              {t("placeholderHelp")}
            </Label>
            <div className="flex max-h-[45vh] flex-wrap gap-1.5 overflow-y-auto">
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

          <div className="space-y-2 rounded-md border p-3">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              {t("aiSectionTitle")}
            </Label>
            {aiConfigured ? (
              <>
                <Textarea
                  value={aiInstructions}
                  onChange={(e) => setAiInstructions(e.target.value)}
                  placeholder={t("aiTemplateInstructionsPlaceholder")}
                  rows={4}
                  disabled={aiLoading}
                />
                <Button
                  type="button"
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={runAiDraft}
                  disabled={aiLoading}
                >
                  {aiLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {t(aiLoading ? "aiGenerating" : "aiGenerate")}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {t("aiTemplateHint")}
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t("aiNotConfigured")}{" "}
                <Link
                  href={`/${locale}/admin/settings/ai`}
                  className="underline"
                >
                  {t("aiConfigureLink")}
                </Link>
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
