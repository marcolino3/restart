"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  updateSettingFormSchema,
  UpdateSettingFormValues,
} from "../schemas/setting-form.schema";
import { updateOrganizationSettingAction } from "../actions/update-setting.action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { OrganizationSetting } from "../actions/get-settings.action";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

interface Props {
  organizationId: string;
  setting: OrganizationSetting | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditSettingSheet = ({
  organizationId,
  setting,
  open,
  onOpenChange,
}: Props) => {
  const router = useRouter();
  const t = useTranslations("OrganizationSettings");
  const tC = useTranslations("Common");

  const form = useForm<UpdateSettingFormValues>({
    resolver: zodResolver(updateSettingFormSchema),
    mode: "onBlur",
    defaultValues: {
      key: "",
      value: "",
      description: "",
    },
  });

  useEffect(() => {
    if (setting) {
      form.reset({
        key: setting.key,
        value: "",
        description: setting.description || "",
      });
    }
  }, [setting, form]);

  const onSubmit = async (values: UpdateSettingFormValues) => {
    if (!setting) return;

    const result = await updateOrganizationSettingAction({
      organizationId,
      key: setting.key,
      value: values.value || undefined,
      description: values.description,
    });

    if (result.success) {
      toast.success(t("updateSuccess", { key: setting.key }));
      router.refresh();
      onOpenChange(false);
    } else {
      toast.error(
        typeof result.error === "string" ? result.error : t("updateError"),
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("editTitle")}</SheetTitle>
          <SheetDescription>
            {t("editDescription")}{" "}
            <code className="bg-muted rounded px-1">{setting?.key}</code>
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-6 space-y-6"
          >
            <InputFormField
              name="value"
              label="valueLabel"
              namespace="OrganizationSettings"
              type="password"
              placeholder={t("valuePlaceholder")}
              description="valueDescription"
            />
            <TextareaFormField
              name="description"
              label="descriptionLabel"
              namespace="OrganizationSettings"
              placeholder={t("descriptionPlaceholder")}
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {tC("cancel")}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {tC("save")}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};
