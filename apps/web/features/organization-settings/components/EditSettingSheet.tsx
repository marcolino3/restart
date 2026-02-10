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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { updateSettingFormSchema, UpdateSettingFormValues } from "../schemas/setting-form.schema";
import { updateOrganizationSettingAction } from "../actions/update-setting.action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { OrganizationSetting } from "../actions/get-settings.action";
import { useEffect } from "react";

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
      toast.success(`Setting "${setting.key}" wurde aktualisiert`);
      router.refresh();
      onOpenChange(false);
    } else {
      toast.error(result.error || "Fehler beim Aktualisieren");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Setting bearbeiten</SheetTitle>
          <SheetDescription>
            Aktualisiere den Wert oder die Beschreibung für{" "}
            <code className="bg-muted rounded px-1">{setting?.key}</code>
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key</FormLabel>
                  <FormControl>
                    <Input {...field} disabled className="font-mono bg-muted" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Neuer Wert (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="Leer lassen um nicht zu ändern" />
                  </FormControl>
                  <FormDescription>
                    Nur ausfüllen wenn der Wert geändert werden soll
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
                  <FormLabel>Beschreibung</FormLabel>
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

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Speichern
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};
