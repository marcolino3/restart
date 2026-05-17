"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
  selectedId: string | undefined;
}

export function HeatmapClassPicker({ classes, selectedId }: Props) {
  const t = useTranslations("RecordKeeping");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  return (
    <div className="min-w-[220px]">
      <Select value={selectedId} onValueChange={handleChange}>
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
