"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Check, XCircle } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface Props {
  name: string;
  label: string;
  onSave: (value: string) => Promise<boolean>;
}

export const InputAutoSaveFormField = ({ name, label, onSave }: Props) => {
  const t = useTranslations("Common");
  const { control, getValues } = useFormContext();
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle"
  );
  const [editing, setEditing] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t(label)}</FormLabel>
          <div className="flex items-center gap-2">
            <FormControl>
              {editing ? (
                <Input
                  {...field}
                  onBlur={async (e) => {
                    const newValue = e.target.value;
                    setStatus("saving");
                    const ok = await onSave(newValue);
                    setStatus(ok ? "success" : "error");
                    setTimeout(() => setStatus("idle"), 2000);
                    setEditing(false);
                  }}
                  autoFocus
                />
              ) : (
                <div
                  className="min-h-[38px] px-2 py-1 text-sm bg-muted rounded-md cursor-pointer w-full flex items-center border border-transparent hover:border-dashed hover:border-gray-400 transition-colors"
                  onClick={() => setEditing(true)}
                >
                  {getValues(name) || (
                    <span className="text-muted-foreground">–</span>
                  )}
                </div>
              )}
            </FormControl>

            {status === "saving" && (
              <Loader2 className="animate-spin size-4 text-muted-foreground" />
            )}
            {status === "success" && (
              <Check className="text-green-600 size-4" />
            )}
            {status === "error" && <XCircle className="text-red-600 size-4" />}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
