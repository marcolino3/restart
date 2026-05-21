"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Check, Loader2, XCircle } from "lucide-react";

import { Slider } from "@/components/ui/slider";
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
  onSave: (value: number) => Promise<boolean>;
  max?: number;
  step?: number;
}

export const SliderFormField = ({
  name,
  label,
  onSave,
  max = 100,
  step = 1,
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
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div className="flex items-center gap-3">
            <FormControl>
              <Slider
                value={[field.value]}
                onValueChange={(val) => {
                  setValue(name, val[0], { shouldDirty: true });
                }}
                onValueCommit={async (val) => {
                  setStatus("saving");
                  const ok = await onSave(val[0]);
                  setStatus(ok ? "success" : "error");
                  setTimeout(() => setStatus("idle"), 2000);
                }}
                max={max}
                step={step}
                className="w-[60%]"
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
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
