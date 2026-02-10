"use client";

import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Check, XCircle } from "lucide-react";
import { useState } from "react";

interface Props {
  name: string;
  label: string;
  onSave: (value: string) => Promise<boolean>;
}

export const TextareaAutoSaveFormField = ({ name, label, onSave }: Props) => {
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
          <div className="flex items-start gap-2">
            <FormControl>
              {editing ? (
                <Textarea
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
                  className="min-h-[80px]"
                />
              ) : (
                <div
                  className="min-h-[80px] px-2 py-1 text-sm bg-muted rounded-md cursor-pointer w-full border border-transparent hover:border-dashed hover:border-gray-400 transition-colors whitespace-pre-line"
                  onClick={() => setEditing(true)}
                >
                  {getValues(name) || (
                    <span className="text-muted-foreground">–</span>
                  )}
                </div>
              )}
            </FormControl>

            {status === "saving" && (
              <Loader2 className="animate-spin size-4 text-muted-foreground mt-1" />
            )}
            {status === "success" && (
              <Check className="text-green-600 size-4 mt-1" />
            )}
            {status === "error" && (
              <XCircle className="text-red-600 size-4 mt-1" />
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
