"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

type LocaleDraft = { name: string; notes: string };

export function CurriculumNodeTranslationsDialog({
  open,
  onOpenChange,
  node,
  onSaved,
}: Props) {
  const t = useTranslations("Curricula");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<CurriculumLocale, LocaleDraft>>({
    DE: { name: "", notes: "" },
    FR: { name: "", notes: "" },
    EN: { name: "", notes: "" },
    IT: { name: "", notes: "" },
  });
  const [savingLocale, setSavingLocale] = useState<CurriculumLocale | null>(
    null,
  );

  useEffect(() => {
    const next: Record<CurriculumLocale, LocaleDraft> = {
      DE: { name: "", notes: "" },
      FR: { name: "", notes: "" },
      EN: { name: "", notes: "" },
      IT: { name: "", notes: "" },
    };
    for (const tr of node.translations) {
      next[tr.locale] = { name: tr.name, notes: tr.notes ?? "" };
    }
    setDrafts(next);
  }, [node]);

  const handleSave = async (locale: CurriculumLocale) => {
    const draft = drafts[locale];
    if (!draft.name.trim()) return;
    setSavingLocale(locale);
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
    setSavingLocale(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("editTranslations")}</DialogTitle>
          <DialogDescription>{t("editTranslationsHint")}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="DE">
          <TabsList className="grid grid-cols-4">
            {CURRICULUM_LOCALES.map((loc) => (
              <TabsTrigger key={loc} value={loc}>
                {loc}
              </TabsTrigger>
            ))}
          </TabsList>
          {CURRICULUM_LOCALES.map((loc) => (
            <TabsContent key={loc} value={loc} className="space-y-3 mt-3">
              <div className="space-y-1.5">
                <Label htmlFor={`name-${loc}`}>{t("name")}</Label>
                <Input
                  id={`name-${loc}`}
                  value={drafts[loc].name}
                  onChange={(e) =>
                    setDrafts((d) => ({
                      ...d,
                      [loc]: { ...d[loc], name: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`notes-${loc}`}>{t("notes")}</Label>
                <Textarea
                  id={`notes-${loc}`}
                  rows={3}
                  value={drafts[loc].notes}
                  onChange={(e) =>
                    setDrafts((d) => ({
                      ...d,
                      [loc]: { ...d[loc], notes: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => handleSave(loc)}
                  disabled={
                    savingLocale === loc || !drafts[loc].name.trim()
                  }
                >
                  {savingLocale === loc ? tCommon("saving") : tCommon("save")}
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
