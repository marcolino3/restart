"use client";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
} from "@/components/ui/select";
import { useFormContext } from "react-hook-form";
import { useState } from "react";
import { Loader2, Check, XCircle } from "lucide-react";

interface Props {
  name: string;
  label: string;
  description?: string;
  options: { value: string; label: string }[];
  onSave: (value: string) => Promise<boolean>;
}

export const SelectFormField = ({
  name,
  label,
  description,
  options,
  onSave,
}: Props) => {
  const { control, setValue } = useFormContext();
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
          <div className="flex items-center gap-2">
            <FormControl>
              <Select
                defaultValue={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  handleChange(value);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Bitte wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
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
