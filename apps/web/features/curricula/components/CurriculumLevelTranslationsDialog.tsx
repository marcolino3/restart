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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { upsertCurriculumLevelTranslationAction } from "../actions/upsert-level-translation.action";
import {
  CURRICULUM_LOCALES,
  type CurriculumLevelDTO,
  type CurriculumLocale,
} from "../types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: CurriculumLevelDTO;
  curriculumId: string;
  onSaved?: (
    levelId: string,
    locale: CurriculumLocale,
    translation: { name: string },
  ) => void;
}

const TranslationsSchema = z.object({
  DE: z.string(),
  FR: z.string(),
  EN: z.string(),
  IT: z.string(),
});
type TranslationsValues = z.infer<typeof TranslationsSchema>;

export function CurriculumLevelTranslationsDialog({
  open,
  onOpenChange,
  level,
  curriculumId,
  onSaved,
}: Props) {
  const t = useTranslations("Curricula");
  const tCommon = useTranslations("Common");
  const router = useRouter();

  const form = useForm<TranslationsValues>({
    resolver: zodResolver(TranslationsSchema),
    defaultValues: { DE: "", FR: "", EN: "", IT: "" },
  });

  useEffect(() => {
    const next: TranslationsValues = { DE: "", FR: "", EN: "", IT: "" };
    for (const tr of level.translations) next[tr.locale] = tr.name;
    form.reset(next);
  }, [level, form]);

  const handleSave = async (locale: CurriculumLocale) => {
    const name = form.getValues(locale).trim();
    if (!name) return;
    const res = await upsertCurriculumLevelTranslationAction(
      { curriculumLevelId: level.id, locale, name },
      curriculumId,
    );
    if (res.success) {
      toast.success(t("translationSaved"));
      onSaved?.(level.id, locale, { name });
      router.refresh();
    } else {
      toast.error(t("translationSaveError"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("editLevelTranslations")}</DialogTitle>
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
              const value = form.watch(loc);
              return (
                <TabsContent key={loc} value={loc} className="mt-3 space-y-3">
                  <InputFormField
                    name={loc}
                    label="name"
                    namespace="Curricula"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      type="button"
                      onClick={() => handleSave(loc)}
                      disabled={form.formState.isSubmitting || !value?.trim()}
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
