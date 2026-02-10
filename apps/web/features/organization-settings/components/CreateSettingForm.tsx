"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { settingFormSchema, SettingFormValues } from "../schemas/setting-form.schema";
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
        <FormField
          control={form.control}
          name="key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Key</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="GOOGLE_API_KEY"
                  className="font-mono"
                  onChange={(e) =>
                    field.onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))
                  }
                />
              </FormControl>
              <FormDescription>
                Nur Grossbuchstaben, Zahlen und Unterstriche
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Wert</FormLabel>
              <FormControl>
                <Input {...field} type="password" placeholder="••••••••" />
              </FormControl>
              <FormDescription>
                Der Wert wird verschlüsselt gespeichert
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beschreibung (optional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Wofür wird dieser Key verwendet?"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
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
