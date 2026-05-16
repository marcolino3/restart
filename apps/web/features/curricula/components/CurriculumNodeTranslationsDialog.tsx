"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form } from "@/components/ui/form";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { Button } from "@/components/ui/button";
import { handleAction } from "@/lib/actions/handle-action";
import { upsertCurriculumNodeTranslationAction } from "../actions/upsert-node-translation.action";
import {
  CURRICULUM_LOCALES,
  type CurriculumLocale,
  type CurriculumNodeDTO,
} from "../types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: CurriculumNodeDTO;
  onSaved?: (
    nodeId: string,
    locale: CurriculumLocale,
    translation: { name: string; notes: string | null },
  ) => void;
}

const LocaleDraftSchema = z.object({
  name: z.string(),
  notes: z.string(),
});
const TranslationsSchema = z.object({
  DE: LocaleDraftSchema,
  FR: LocaleDraftSchema,
  EN: LocaleDraftSchema,
  IT: LocaleDraftSchema,
});
type TranslationsValues = z.infer<typeof TranslationsSchema>;

const EMPTY: TranslationsValues = {
  DE: { name: "", notes: "" },
  FR: { name: "", notes: "" },
  EN: { name: "", notes: "" },
  IT: { name: "", notes: "" },
};

export function CurriculumNodeTranslationsDialog({
  open,
  onOpenChange,
  node,
  onSaved,
}: Props) {
  const t = useTranslations("Curricula");
  const tCommon = useTranslations("Common");
  const router = useRouter();

  const form = useForm<TranslationsValues>({
    resolver: zodResolver(TranslationsSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    const next: TranslationsValues = JSON.parse(JSON.stringify(EMPTY));
    for (const tr of node.translations) {
      next[tr.locale] = { name: tr.name, notes: tr.notes ?? "" };
    }
    form.reset(next);
  }, [node, form]);

  const handleSave = async (locale: CurriculumLocale) => {
    const draft = form.getValues(locale);
    if (!draft.name.trim()) return;
    await handleAction({
      action: () =>
        upsertCurriculumNodeTranslationAction({
          curriculumNodeId: node.id,
          locale,
          name: draft.name,
          notes: draft.notes || undefined,
        }),
      successMessage: t("translationSaved"),
      errorMessage: t("translationSaveError"),
      onSuccess: () => {
        onSaved?.(node.id, locale, {
          name: draft.name,
          notes: draft.notes || null,
        });
        router.refresh();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("editTranslations")}</DialogTitle>
          <DialogDescription>{t("editTranslationsHint")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <Tabs defaultValue="DE">
            <TabsList className="grid grid-cols-4">
              {CURRICULUM_LOCALES.map((loc) => (
                <TabsTrigger key={loc} value={loc}>
                  {loc}
                </TabsTrigger>
              ))}
            </TabsList>
            {CURRICULUM_LOCALES.map((loc) => {
              const draft = form.watch(loc);
              return (
                <TabsContent key={loc} value={loc} className="mt-3 space-y-3">
                  <InputFormField
                    name={`${loc}.name`}
                    label="name"
                    namespace="Curricula"
                  />
                  <TextareaFormField
                    name={`${loc}.notes`}
                    label="notes"
                    namespace="Curricula"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      type="button"
                      onClick={() => handleSave(loc)}
                      disabled={
                        form.formState.isSubmitting || !draft?.name?.trim()
                      }
                    >
                      {form.formState.isSubmitting
                        ? tCommon("saving")
                        : tCommon("save")}
                    </Button>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </Form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
