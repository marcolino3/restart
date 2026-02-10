"use client";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFormContext } from "react-hook-form";
import { useState } from "react";
import { Check, Loader2, XCircle } from "lucide-react";

interface Props {
  name: string;
  label: string;
  description?: string;
  options: { label: string; value: string }[];
  onSave: (value: string) => Promise<boolean>;
}

export const RadioGroupFormField = ({
  name,
  label,
  description,
  options,
  onSave,
}: Props) => {
  const { control, getValues, setValue } = useFormContext();
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle"
  );

  const handleChange = async (newValue: string) => {
    setValue(name, newValue);
    setStatus("saving");
    const ok = await onSave(newValue);
    setStatus(ok ? "success" : "error");
    setTimeout(() => setStatus("idle"), 2000);
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          {description && <FormDescription>{description}</FormDescription>}
          <FormControl>
            <div className="flex items-center gap-2">
              <RadioGroup
                defaultValue={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  handleChange(value);
                }}
                className="flex gap-4"
              >
                {options.map((opt) => (
                  <FormItem
                    key={opt.value}
                    className="flex items-center space-x-2"
                  >
                    <FormControl>
                      <RadioGroupItem value={opt.value} />
                    </FormControl>
                    <FormLabel className="font-normal">{opt.label}</FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>

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
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
