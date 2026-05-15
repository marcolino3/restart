"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Props {
  paramKey?: string;
}

export function ShowArchivedToggle({ paramKey = "archived" }: Props) {
  const t = useTranslations("Curricula");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const checked = searchParams.get(paramKey) === "1";

  const onChange = (next: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set(paramKey, "1");
    else params.delete(paramKey);
    const query = params.toString();
    startTransition(() => {
      router.push(`${pathname}${query ? `?${query}` : ""}`);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Switch
        id="show-archived"
        checked={checked}
        onCheckedChange={onChange}
        disabled={isPending}
      />
      <Label htmlFor="show-archived" className="cursor-pointer">
        {t("showArchived")}
      </Label>
    </div>
  );
}
