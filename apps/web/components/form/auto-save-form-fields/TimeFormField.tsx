"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Check, XCircle } from "lucide-react";
import { format, setHours, setMinutes } from "date-fns";

interface Props {
  name: string;
  label: string;
  onSave: (value: Date) => Promise<boolean>;
}

export const TimeFormField = ({ name, label, onSave }: Props) => {
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
          <FormLabel>{label}</FormLabel>
          <div className="flex items-center gap-2">
            <FormControl>
              {editing ? (
                <Input
                  type="time"
                  defaultValue={field.value ? format(field.value, "HH:mm") : ""}
                  step={60}
                  onBlur={async (e) => {
                    const [h, m] = e.target.value.split(":").map(Number);
                    const baseDate = field.value
                      ? new Date(field.value)
                      : new Date();
                    const updatedDate = setMinutes(setHours(baseDate, h), m);

                    field.onChange(updatedDate);
                    setStatus("saving");
                    const ok = await onSave(updatedDate);
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
                  {field.value ? (
                    <>{format(new Date(field.value), "HH:mm")}</>
                  ) : (
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
