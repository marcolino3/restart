"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Check, Loader2, XCircle } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

interface Props {
  name: string;
  label: string;
  onSave: (value: boolean) => Promise<boolean>;
}

export const SwitchAutoSaveFormField = ({ name, label, onSave }: Props) => {
  const { control, setValue } = useFormContext();
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle"
  );

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center gap-2 space-y-0">
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={async (checked) => {
                setValue(name, checked, { shouldDirty: true });
                setStatus("saving");
                const ok = await onSave(checked);
                setStatus(ok ? "success" : "error");
                setTimeout(() => setStatus("idle"), 2000);
              }}
            />
          </FormControl>
          <FormLabel htmlFor={name} className="font-normal">
            {label}
          </FormLabel>

          {status === "saving" && (
            <Loader2 className="animate-spin size-4 text-muted-foreground" />
          )}
          {status === "success" && <Check className="text-green-600 size-4" />}
          {status === "error" && <XCircle className="text-red-600 size-4" />}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
