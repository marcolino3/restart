"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  classes: { id: string; name: string }[];
}

/**
 * Persistent classroom picker that lives in the record-keeping layout —
 * sits above the top-tab nav and stays in sync across Erfassung / Heatmap /
 * Schüler via the shared `?classId=` URL search-param.
 *
 * Self-contained: reads the current selection from the URL, falls back to
 * the first class on first visit (and pushes the fallback into the URL so
 * sub-pages see a stable value without each having to re-implement that
 * fallback).
 */
export function RecordKeepingClassPicker({ classes }: Props) {
  const t = useTranslations("RecordKeeping");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlClassId = searchParams.get("classId");

  const validIds = new Set(classes.map((c) => c.id));
  const selectedClassId =
    urlClassId && validIds.has(urlClassId) ? urlClassId : classes[0]?.id;

  // First visit (no ?classId=…): hoist the fallback into the URL so every
  // tab/page reads the same value. Avoid the loop by checking the URL.
  useEffect(() => {
    if (!selectedClassId) return;
    if (urlClassId === selectedClassId) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("classId", selectedClassId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [selectedClassId, urlClassId, pathname, router, searchParams]);

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("classId", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (classes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        {t("noStudentsInClassroom")}
      </p>
    );
  }

  // Single-class teacher: no point showing a picker with one option.
  // The pathname-aware sub-pages still read `?classId=…` from the URL,
  // which we keep populated via the `useEffect` above.
  if (classes.length === 1) {
    return null;
  }

  return (
    <div className="min-w-[220px]">
      <Select value={selectedClassId} onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue placeholder={t("selectClassroom")} />
        </SelectTrigger>
        <SelectContent>
          {classes.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
