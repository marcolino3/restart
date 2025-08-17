"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Loader2, Check, XCircle } from "lucide-react";

interface Props {
  name: string;
  label: string;
  description?: string;
  disabled?: boolean;
  onSave: (value: boolean) => Promise<boolean>;
}

export const SwitchBoxFormField = ({
  name,
  label,
  description,
  disabled = false,
  onSave,
}: Props) => {
  const { control, setValue } = useFormContext();
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle"
  );

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
          <div className="space-y-0.5">
            <FormLabel>{label}</FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <div className="flex items-center gap-2">
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={async (checked: boolean) => {
                  setStatus("saving");
                  setValue(name, checked);
                  const ok = await onSave(checked);
                  setStatus(ok ? "success" : "error");
                  setTimeout(() => setStatus("idle"), 1500);
                }}
                disabled={disabled}
              />
            </FormControl>
            {status === "saving" && (
              <Loader2 className="animate-spin size-4 text-muted-foreground" />
            )}
            {status === "success" && (
              <Check className="text-green-600 size-4" />
            )}
            {status === "error" && <XCircle className="text-red-600 size-4" />}
          </div>
        </FormItem>
      )}
    />
  );
};
