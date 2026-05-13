"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle, FileText, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { handleAction } from "@/lib/actions/handle-action";
import { ROUTES } from "@/constants/routes";
import { importCurriculumFromPlanAction } from "../actions/import-curriculum-from-plan.action";
import { pickTranslation, type CurriculumLocale, type ImportPlan } from "../types";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function CurriculumImportDialog() {
  const t = useTranslations("Curricula");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const locale = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const reset = () => {
    setPlan(null);
    setName("");
    setSlug("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExts = [".xlsx", ".xls", ".csv"];
    if (!validExts.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      toast.error(t("importInvalidFormat"));
      return;
    }

    setIsUploading(true);
    setPlan(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/curricula/import/preview", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(body?.message ?? `Upload failed: ${res.statusText}`);
      }
      const data = (await res.json()) as ImportPlan;
      setPlan(data);
      const defaultName = file.name.replace(/\.[^.]+$/, "");
      setName(defaultName);
      setSlug(slugify(defaultName));
    } catch (err) {
      toast.error(t("importPreviewError"), {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCommit = async () => {
    if (!plan || !name.trim() || !slug.trim()) return;
    setIsCommitting(true);
    const result = await handleAction({
      action: () => importCurriculumFromPlanAction(plan, slug.trim(), name.trim()),
      successMessage: t("importCommitted"),
      errorMessage: t("importCommitError"),
      onSuccess: (data) => {
        router.push(ROUTES.admin.curriculaEdit(locale, data.id));
        router.refresh();
        setOpen(false);
        reset();
      },
    });
    setIsCommitting(false);
    return result;
  };

  const localeUpper = locale.toUpperCase() as CurriculumLocale;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          {t("importFromFile")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("importTitle")}</DialogTitle>
          <DialogDescription>{t("importDescription")}</DialogDescription>
        </DialogHeader>

        {!plan && (
          <div className="space-y-3">
            <div className="bg-muted p-4 rounded-lg text-sm space-y-1">
              <div className="flex items-center gap-2 font-medium">
                <FileText className="h-4 w-4" />
                {t("importExpectedColumns")}
              </div>
              <code className="text-xs bg-background p-2 rounded block overflow-x-auto">
                Level · Sequence · Area · Topic · Presentation · Work/Lesson
              </code>
              <p className="text-xs text-muted-foreground">
                {t("importFormatHint")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              {isUploading && <Loader2 className="h-5 w-5 animate-spin" />}
            </div>
          </div>
        )}

        {plan && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
              <Stat label={t("rowCount")} value={plan.stats.rowCount} />
              <Stat label={t("levelCount")} value={plan.stats.levelCount} />
              <Stat label={t("areaCount")} value={plan.stats.areaCount} />
              <Stat label={t("topicCount")} value={plan.stats.topicCount} />
              <Stat
                label={t("presentationCount")}
                value={plan.stats.presentationCount}
              />
              <Stat label={t("workCount")} value={plan.stats.workCount} />
            </div>

            {plan.warnings.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded text-sm">
                <ul className="list-disc pl-5 space-y-1">
                  {plan.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="curr-name">{t("curriculumName")}</Label>
                <Input
                  id="curr-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug || slug === slugify(name)) {
                      setSlug(slugify(e.target.value));
                    }
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="curr-slug">{t("slug")}</Label>
                <Input
                  id="curr-slug"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                />
              </div>
            </div>

            <div className="border rounded-lg max-h-80 overflow-y-auto p-2 text-sm">
              {plan.levels.map((lvl) => (
                <div key={lvl.slug} className="mb-3">
                  <div className="font-semibold">
                    {pickTranslation(lvl.translations, localeUpper)?.name ??
                      lvl.slug}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({lvl.roots.length} {t("topLevelNodes")})
                    </span>
                  </div>
                  <ul className="pl-4 list-disc text-muted-foreground">
                    {lvl.roots.slice(0, 5).map((n) => (
                      <li key={n.tempId}>
                        {pickTranslation(n.translations, localeUpper)?.name}
                      </li>
                    ))}
                    {lvl.roots.length > 5 && (
                      <li>
                        … {lvl.roots.length - 5} {t("moreItems")}
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          {plan && (
            <Button variant="outline" onClick={reset} disabled={isCommitting}>
              {tCommon("back")}
            </Button>
          )}
          <Button
            onClick={handleCommit}
            disabled={!plan || !name.trim() || !slug.trim() || isCommitting}
          >
            {isCommitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("importing")}
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                {t("importCommit")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-muted rounded p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
