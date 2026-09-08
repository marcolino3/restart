"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronDown,
  Copy,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { EditorFormField } from "@/components/form/form-fields/EditorFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { ROUTES } from "@/constants/routes";

import {
  CONTRACT_TEMPLATE_PLACEHOLDERS,
  fillSampleValues,
} from "../placeholders";
import { buildA4PreviewDoc } from "../a4-preview";
import {
  createContractTemplateAction,
  updateContractTemplateAction,
} from "../actions/mutate-contract-template.action";
import { ContractAiChat } from "./ContractAiChat";
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
  const [previewOpen, setPreviewOpen] = useState(true);
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

  // eslint-disable-next-line react-hooks/incompatible-library -- React Hook Form returns non-memoizable functions by design
  const [bodyHtml, headerHtml, footerHtml] = form.watch([
    "bodyHtml",
    "headerHtml",
    "footerHtml",
  ]);
  const previewDoc = buildA4PreviewDoc({
    headerHtml: fillSampleValues(headerHtml || ""),
    bodyHtml: fillSampleValues(bodyHtml || ""),
    footerHtml: fillSampleValues(footerHtml || ""),
  });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-7 gap-1 px-2 text-xs"
        onClick={() => router.push(listUrl)}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("backToList")}
      </Button>

      <div
        className={cn(
          "grid gap-6",
          previewOpen
            ? "lg:grid-cols-2"
            : "lg:grid-cols-[minmax(0,1fr)_auto]",
        )}
      >
        <div className="min-w-0 space-y-4">
          {aiConfigured ? (
            <ContractAiChat
              getCurrentHtml={() => form.getValues("bodyHtml")}
              onDraft={(html) =>
                form.setValue("bodyHtml", html, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
          ) : (
            <Card className="space-y-2 p-3">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                {t("aiSectionTitle")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t("aiNotConfigured")}{" "}
                <Link
                  href={`/${locale}/admin/settings/ai`}
                  className="underline"
                >
                  {t("aiConfigureLink")}
                </Link>
              </p>
            </Card>
          )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, onInvalid)}
            className="space-y-4"
          >
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
                <div className="space-y-1.5">
                  <CardTitle>
                    {t(isEdit ? "editTitle" : "createTitle")}
                  </CardTitle>
                  <CardDescription>{t("dialogDescription")}</CardDescription>
                </div>
                <Button type="submit" disabled={saving} className="shrink-0">
                  {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                  {t("save")}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
            <InputFormField
              name="name"
              label="name"
              namespace="ContractTemplates"
              placeholder={t("namePlaceholder")}
            />

            <Collapsible className="rounded-md border">
              <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium [&[data-state=open]>svg]:rotate-180">
                {t("placeholderSection")}
                <ChevronDown className="h-4 w-4 transition-transform" />
              </CollapsibleTrigger>
              <CollapsibleContent className="border-t p-3">
                <p className="mb-2 text-xs text-muted-foreground">
                  {t("placeholderHelp")}
                </p>
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
              </CollapsibleContent>
            </Collapsible>

            <Collapsible className="rounded-md border">
              <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium [&[data-state=open]>svg]:rotate-180">
                {t("headerFooterSection")}
                <ChevronDown className="h-4 w-4 transition-transform" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 border-t p-3">
                <EditorFormField
                  name="headerHtml"
                  label="headerHtml"
                  namespace="ContractTemplates"
                  compact
                />
                <EditorFormField
                  name="footerHtml"
                  label="footerHtml"
                  namespace="ContractTemplates"
                  compact
                />
              </CollapsibleContent>
            </Collapsible>

            <EditorFormField
              name="bodyHtml"
              label="bodyHtml"
              namespace="ContractTemplates"
              a4
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
              </CardContent>
            </Card>
          </form>
        </Form>
        </div>

        {/* Live preview beside the form (sticky, collapsible sideways) */}
        <aside className="min-w-0 lg:sticky lg:top-16 lg:self-start">
          {previewOpen ? (
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
                <div className="space-y-1.5">
                  <CardTitle>{t("previewTitle")}</CardTitle>
                  <CardDescription>{t("previewSampleHint")}</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  title={t("previewCollapse")}
                  aria-label={t("previewCollapse")}
                  onClick={() => setPreviewOpen(false)}
                >
                  <PanelRightClose className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <iframe
                  title={t("previewTitle")}
                  sandbox="allow-scripts"
                  srcDoc={previewDoc}
                  className="h-[75vh] w-full rounded-md border bg-muted"
                />
              </CardContent>
            </Card>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="gap-1.5"
              onClick={() => setPreviewOpen(true)}
            >
              <PanelRightOpen className="h-4 w-4" />
              {t("previewTitle")}
            </Button>
          )}
        </aside>
      </div>
    </div>
  );
}
