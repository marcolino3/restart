"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, FileText, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ROUTES } from "@/constants/routes";
import { importCurriculumFromPlanAction } from "../actions/import-curriculum-from-plan.action";
import { pickTranslation, type CurriculumLocale, type ImportPlan } from "../types";

const NameSchema = z.object({ name: z.string() });

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

  const nameForm = useForm<z.infer<typeof NameSchema>>({
    resolver: zodResolver(NameSchema),
    defaultValues: { name: "" },
  });
  const name = nameForm.watch("name");

  const reset = () => {
    setPlan(null);
    nameForm.reset({ name: "" });
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
      nameForm.reset({ name: defaultName });
    } catch (err) {
      toast.error(t("importPreviewError"), {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCommit = async () => {
    if (!plan || !name.trim()) return;
    const finalSlug = slugify(name.trim());
    if (!finalSlug) return;
    setIsCommitting(true);
    try {
      const result = await importCurriculumFromPlanAction(
        plan,
        finalSlug,
        name.trim(),
      );
      if (!result.success) {
        toast.error(t("importCommitError"), {
          description: result.error ? String(result.error) : undefined,
        });
        return;
      }
      // Backend done + revalidatePath() fired in the action. Navigate first
      // so the user lands on the fresh edit page, then show success toast.
      router.push(ROUTES.admin.curriculaEdit(locale, result.data.id));
      router.refresh();
      toast.success(t("importCommitted"));
      setOpen(false);
      reset();
    } finally {
      setIsCommitting(false);
    }
  };

  const localeUpper = locale.toUpperCase() as CurriculumLocale;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (isCommitting || isUploading) return;
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
                Sequence · Level · Area · Topic · Group · Lesson
              </code>
              <p className="text-xs text-muted-foreground">
                {t("importFormatHint")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("importMultiSheetHint")}
              </p>
              <a
                href="/curricula-import-template.xlsx"
                download
                className="text-xs text-primary underline-offset-4 hover:underline"
              >
                {t("importDownloadTemplate")}
              </a>
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
                label={t("groupCount")}
                value={plan.stats.groupCount}
              />
              <Stat label={t("lessonCount")} value={plan.stats.lessonCount} />
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

            <Form {...nameForm}>
              <InputFormField
                name="name"
                label="curriculumName"
                namespace="Curricula"
              />
            </Form>

            <div className="border rounded-lg max-h-80 overflow-y-auto p-2 text-sm">
              {plan.levels.map((lvl) => (
                <div key={lvl.slug} className="mb-3">
                  <div className="flex items-center gap-2 font-semibold">
                    <span>
                      {pickTranslation(lvl.translations, localeUpper)?.name ??
                        lvl.slug}
                    </span>
                    <LocaleBadges translations={lvl.translations} />
                    <span className="text-xs text-muted-foreground font-normal">
                      ({lvl.roots.length} {t("topLevelNodes")})
                    </span>
                  </div>
                  <ul className="pl-4 list-disc text-muted-foreground">
                    {lvl.roots.slice(0, 5).map((n) => (
                      <li key={n.tempId} className="flex items-center gap-2">
                        <span>
                          {pickTranslation(n.translations, localeUpper)?.name}
                        </span>
                        <LocaleBadges translations={n.translations} />
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
            disabled={!plan || !name.trim() || isCommitting}
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

const ALL_LOCALES: CurriculumLocale[] = ["DE", "FR", "IT", "EN"];

function LocaleBadges({
  translations,
}: {
  translations: { locale: CurriculumLocale; name: string }[];
}) {
  const present = new Set(translations.map((t) => t.locale));
  return (
    <span className="flex items-center gap-1">
      {ALL_LOCALES.map((loc) => (
        <span
          key={loc}
          className={
            present.has(loc)
              ? "text-[10px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
              : "text-[10px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground/50"
          }
        >
          {loc}
        </span>
      ))}
    </span>
  );
}
