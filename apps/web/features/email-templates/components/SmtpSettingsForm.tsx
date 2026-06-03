"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { InputFormField } from "@/components/form/form-fields/InputFormField";

import {
  saveSmtpSettingsAction,
  type SmtpSettings,
} from "../actions/smtp-settings-actions";

const Schema = z.object({
  host: z.string().min(1),
  port: z
    .string()
    .regex(/^\d+$/, { message: "numeric" })
    .optional()
    .or(z.literal("")),
  user: z.string().min(1),
  password: z.string().optional(),
  fromEmail: z.string().email(),
  fromName: z.string().optional(),
});

type FormValues = z.infer<typeof Schema>;

interface Props {
  organizationId: string;
  initial: SmtpSettings;
  canManage: boolean;
}

export function SmtpSettingsForm({ organizationId, initial, canManage }: Props) {
  const t = useTranslations("EmailTemplates");
  const [saving, setSaving] = useState(false);
  const [secure, setSecure] = useState(initial.secure);

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      host: initial.host,
      port: initial.port || "587",
      user: initial.user,
      password: "",
      fromEmail: initial.fromEmail,
      fromName: initial.fromName,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    const res = await saveSmtpSettingsAction({
      organizationId,
      host: values.host,
      port: values.port || "587",
      secure,
      user: values.user,
      password: values.password,
      fromEmail: values.fromEmail,
      fromName: values.fromName ?? "",
    });
    setSaving(false);
    if (!res.success) {
      toast.error(res.error ?? t("smtpSaveError"));
      return;
    }
    toast.success(t("smtpSaveOk"));
    form.setValue("password", "");
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold">{t("smtpTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("smtpSubtitle")}</p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 rounded-lg border bg-card p-5 shadow-sm"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <InputFormField
                name="host"
                label="smtpHost"
                namespace="EmailTemplates"
                placeholder="mail.infomaniak.com"
                disabled={!canManage}
              />
            </div>
            <InputFormField
              name="port"
              label="smtpPort"
              namespace="EmailTemplates"
              type="number"
              placeholder="587"
              disabled={!canManage}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label className="text-sm">{t("smtpSecure")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("smtpSecureHint")}
              </p>
            </div>
            <Switch
              checked={secure}
              onCheckedChange={setSecure}
              disabled={!canManage}
            />
          </div>

          <InputFormField
            name="user"
            label="smtpUser"
            namespace="EmailTemplates"
            placeholder="noreply@schule.ch"
            disabled={!canManage}
          />
          <InputFormField
            name="password"
            label="smtpPassword"
            namespace="EmailTemplates"
            type="password"
            placeholder={
              initial.passwordSet ? t("smtpPasswordKeep") : undefined
            }
            description="smtpPasswordHint"
            disabled={!canManage}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputFormField
              name="fromEmail"
              label="smtpFromEmail"
              namespace="EmailTemplates"
              type="email"
              placeholder="info@schule.ch"
              disabled={!canManage}
            />
            <InputFormField
              name="fromName"
              label="smtpFromName"
              namespace="EmailTemplates"
              placeholder="Schule Sonnenberg"
              disabled={!canManage}
            />
          </div>

          {canManage && (
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                {t("smtpSave")}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
