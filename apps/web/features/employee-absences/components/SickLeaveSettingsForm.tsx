"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, PlugZap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { InputFormField } from "@/components/form/form-fields/InputFormField";

import {
  saveSickLeaveSettingsAction,
  testCalendarConnectionAction,
  type SickLeaveSettings,
} from "../actions/sick-leave-settings.actions";

const Schema = z.object({
  notificationEmail: z.string().email().or(z.literal("")),
  serviceAccountJson: z.string().optional(),
  impersonationUser: z.string().email().or(z.literal("")),
  calendarId: z.string().optional(),
});

type FormValues = z.infer<typeof Schema>;

interface Props {
  organizationId: string;
  initial: SickLeaveSettings;
  canManage: boolean;
}

export function SickLeaveSettingsForm({
  organizationId,
  initial,
  canManage,
}: Props) {
  const t = useTranslations("SickLeave");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [calendarEnabled, setCalendarEnabled] = useState(initial.calendarEnabled);

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      notificationEmail: initial.notificationEmail,
      serviceAccountJson: "",
      impersonationUser: initial.impersonationUser,
      calendarId: initial.calendarId,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    const res = await saveSickLeaveSettingsAction({
      organizationId,
      notificationEmail: values.notificationEmail,
      calendarEnabled,
      impersonationUser: values.impersonationUser,
      calendarId: values.calendarId ?? "",
      serviceAccountJson: values.serviceAccountJson,
    });
    setSaving(false);
    if (!res.success) {
      toast.error(res.error ?? t("saveError"));
      return;
    }
    toast.success(t("saveSuccess"));
    // Never keep the secret in the client form state after a save.
    form.setValue("serviceAccountJson", "");
  };

  const onTest = async () => {
    setTesting(true);
    const res = await testCalendarConnectionAction();
    setTesting(false);

    if (!res.success) {
      toast.error(t("testConnectionFailed", { error: res.error ?? "" }));
      return;
    }
    if (!res.ok) {
      toast.error(t("testConnectionFailed", { error: res.error ?? "" }));
      return;
    }
    toast.success(
      t("testConnectionSuccess", { calendar: res.calendarSummary ?? "" })
    );
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{t("settingsTitle")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("settingsDescription")}
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 rounded-lg border bg-card p-5 shadow-sm"
        >
          <InputFormField
            name="notificationEmail"
            label="notificationEmail"
            namespace="SickLeave"
            type="email"
            placeholder="hr@schule.ch"
            description="notificationEmailDescription"
            disabled={!canManage}
          />

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label className="text-sm">{t("calendarEnabled")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("calendarEnabledDescription")}
              </p>
            </div>
            <Switch
              checked={calendarEnabled}
              onCheckedChange={setCalendarEnabled}
              disabled={!canManage}
            />
          </div>

          <InputFormField
            name="serviceAccountJson"
            label="serviceAccountJson"
            namespace="SickLeave"
            type="password"
            placeholder={
              initial.serviceAccountSet ? t("secretStoredHint") : undefined
            }
            description="serviceAccountJsonDescription"
            disabled={!canManage}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputFormField
              name="impersonationUser"
              label="impersonationUser"
              namespace="SickLeave"
              type="email"
              placeholder="hr@schule.ch"
              description="impersonationUserDescription"
              disabled={!canManage}
            />
            <InputFormField
              name="calendarId"
              label="calendarId"
              namespace="SickLeave"
              placeholder="absences@schule.ch"
              description="calendarIdDescription"
              disabled={!canManage}
            />
          </div>

          {canManage && (
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onTest}
                disabled={testing || saving}
              >
                {testing ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <PlugZap className="mr-1 h-4 w-4" />
                )}
                {t("testConnection")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                {t("save")}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
