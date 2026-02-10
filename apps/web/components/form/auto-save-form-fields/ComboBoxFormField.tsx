"use client";

import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandItem } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Loader2, XCircle } from "lucide-react";
import { useState } from "react";

interface Option {
  label: string;
  value: string;
}

interface Props {
  name: string;
  label: string;
  options: Option[];
  onSave: (value: string) => Promise<boolean>;
}

export const ComboboxFormField = ({ name, label, options, onSave }: Props) => {
  const { control, setValue } = useFormContext();
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle"
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selected = options.find((opt) => opt.value === field.value);
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="flex items-center gap-2">
              <FormControl>
                {editing ? (
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                      >
                        {selected?.label || "Auswählen..."}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                      <Command>
                        {options.map((option) => (
                          <CommandItem
                            key={option.value}
                            onSelect={async () => {
                              setOpen(false);
                              setValue(name, option.value);
                              setStatus("saving");
                              const ok = await onSave(option.value);
                              setStatus(ok ? "success" : "error");
                              setTimeout(() => setStatus("idle"), 2000);
                              setEditing(false);
                            }}
                          >
                            {option.label}
                            {field.value === option.value && (
                              <Check className="ml-auto h-4 w-4" />
                            )}
                          </CommandItem>
                        ))}
                      </Command>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <div
                    className="min-h-[38px] px-2 py-1 text-sm bg-muted rounded-md cursor-pointer w-full flex items-center border border-transparent hover:border-dashed hover:border-gray-400 transition-colors"
                    onClick={() => setEditing(true)}
                  >
                    {selected?.label || (
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
              {status === "error" && (
                <XCircle className="text-red-600 size-4" />
              )}
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};
