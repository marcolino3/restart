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

  const [drafts, setDrafts] = useState<Record<CurriculumLocale, string>>({
    DE: "",
    FR: "",
    EN: "",
    IT: "",
  });
  const [savingLocale, setSavingLocale] = useState<CurriculumLocale | null>(
    null,
  );

  useEffect(() => {
    const next: Record<CurriculumLocale, string> = {
      DE: "",
      FR: "",
      EN: "",
      IT: "",
    };
    for (const tr of level.translations) {
      next[tr.locale] = tr.name;
    }
    setDrafts(next);
  }, [level]);

  const handleSave = async (locale: CurriculumLocale) => {
    const name = drafts[locale].trim();
    if (!name) return;
    setSavingLocale(locale);
    try {
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
    } finally {
      setSavingLocale(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("editLevelTranslations")}</DialogTitle>
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
                <Label htmlFor={`level-name-${loc}`}>{t("name")}</Label>
                <Input
                  id={`level-name-${loc}`}
                  value={drafts[loc]}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [loc]: e.target.value }))
                  }
                />
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => handleSave(loc)}
                  disabled={savingLocale === loc || !drafts[loc].trim()}
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
