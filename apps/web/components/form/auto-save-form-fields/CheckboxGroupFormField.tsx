"use client";

import { useFormContext } from "react-hook-form";
import { useState } from "react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Check, XCircle } from "lucide-react";

interface CheckboxItem {
  id: string;
  label: string;
}

interface Props {
  name: string;
  label: string;
  description?: string;
  items: CheckboxItem[];
  onSave: (value: string[]) => Promise<boolean>;
}

export const CheckboxGroupFormField = ({
  name,
  label,
  description,
  items,
  onSave,
}: Props) => {
  const { control } = useFormContext();
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle"
  );

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="mb-4 flex items-center gap-2">
            <FormLabel className="text-base">{label}</FormLabel>
            {status === "saving" && (
              <Loader2 className="animate-spin size-4 text-muted-foreground" />
            )}
            {status === "success" && (
              <Check className="text-green-600 size-4" />
            )}
            {status === "error" && <XCircle className="text-red-600 size-4" />}
          </div>

          {description && <FormDescription>{description}</FormDescription>}

          {items.map((item) => (
            <FormItem
              key={item.id}
              className="flex flex-row items-center gap-2 space-y-0"
            >
              <FormControl>
                <Checkbox
                  checked={field.value?.includes(item.id)}
                  onCheckedChange={async (checked) => {
                    const newValue = checked
                      ? [...field.value, item.id]
                      : field.value.filter((val: string) => val !== item.id);

                    field.onChange(newValue);
                    setStatus("saving");
                    const ok = await onSave(newValue);
                    setStatus(ok ? "success" : "error");
                    setTimeout(() => setStatus("idle"), 2000);
                  }}
                />
              </FormControl>
              <FormLabel className="text-sm font-normal">
                {item.label}
              </FormLabel>
            </FormItem>
          ))}

          <FormMessage />
        </FormItem>
      )}
    />
  );
};
