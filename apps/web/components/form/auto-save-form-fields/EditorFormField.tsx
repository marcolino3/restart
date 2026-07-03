"use client";

import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useState } from "react";
import { Check, Loader2, XCircle } from "lucide-react";
import dynamic from "next/dynamic";

// MDXEditor nur clientseitig laden
const MDXEditor = dynamic(
  () => import("@mdxeditor/editor").then((mod) => mod.MDXEditor),
  { ssr: false }
);

interface Props {
  name: string;
  label: string;
  onSave: (value: string) => Promise<boolean>;
}

export const EditorFormField = ({ name, label, onSave }: Props) => {
  const { control, getValues, setValue } = useFormContext();
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
          <div className="relative border rounded-md p-2 bg-muted">
            <FormControl>
              <div
                onBlur={async () => {
                  setStatus("saving");
                  const ok = await onSave(getValues(name));
                  setStatus(ok ? "success" : "error");
                  setTimeout(() => setStatus("idle"), 2000);
                }}
              >
                <MDXEditor
                  markdown={field.value}
                  onChange={(val: string) => {
                    setValue(name, val, { shouldDirty: true });
                  }}
                  className="min-h-[150px]"
                />
              </div>
            </FormControl>
            <div className="absolute top-2 right-2">
              {status === "saving" && (
                <Loader2 className="animate-spin size-4 text-muted-foreground" />
              )}
              {status === "success" && (
                <Check className="text-green-600 size-4" />
              )}
              {status === "error" && (
                <XCircle className="text-red-600 size-4" />
              )}
            </div>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
