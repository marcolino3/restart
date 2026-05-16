"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  settingFormSchema,
  SettingFormValues,
} from "../schemas/setting-form.schema";
import { createOrganizationSettingAction } from "../actions/create-setting.action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface Props {
  organizationId: string;
  onSuccess?: () => void;
}

export const CreateSettingForm = ({ organizationId, onSuccess }: Props) => {
  const router = useRouter();

  const form = useForm<SettingFormValues>({
    resolver: zodResolver(settingFormSchema),
    mode: "onBlur",
    defaultValues: {
      key: "",
      value: "",
      description: "",
    },
  });

  const onSubmit = async (values: SettingFormValues) => {
    const result = await createOrganizationSettingAction({
      organizationId,
      key: values.key,
      value: values.value,
      description: values.description,
    });

    if (result.success) {
      toast.success(`Setting "${values.key}" wurde erstellt`);
      form.reset();
      router.refresh();
      onSuccess?.();
    } else {
      toast.error(result.error || "Fehler beim Erstellen");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <InputFormField
          name="key"
          label="createKeyLabel"
          namespace="OrganizationSettings"
          placeholder="GOOGLE_API_KEY"
        />
        <InputFormField
          name="value"
          label="createValueLabel"
          namespace="OrganizationSettings"
          type="password"
          placeholder="••••••••"
        />
        <TextareaFormField
          name="description"
          label="descriptionLabel"
          namespace="OrganizationSettings"
          placeholder="Wofür wird dieser Key verwendet?"
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Setting erstellen
        </Button>
      </form>
    </Form>
  );
};
