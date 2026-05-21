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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Loader2, Check, XCircle } from "lucide-react";
import { format } from "date-fns";

interface Props {
  name: string;
  label: string;
  onSave: (value: Date) => Promise<boolean>;
}

export const CalendarDateFormField = ({ name, label, onSave }: Props) => {
  const { control } = useFormContext();
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
                <Popover open onOpenChange={() => setEditing(false)}>
                  <PopoverTrigger asChild>
                    <div />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        if (!date) return;
                        field.onChange(date);
                        setStatus("saving");
                        onSave(date).then((ok) => {
                          setStatus(ok ? "success" : "error");
                          setTimeout(() => setStatus("idle"), 2000);
                          setEditing(false);
                        });
                      }}
                      captionLayout="dropdown"
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <div
                  className="min-h-[38px] px-2 py-1 text-sm bg-muted rounded-md cursor-pointer w-full flex items-center border border-transparent hover:border-dashed hover:border-gray-400 transition-colors"
                  onClick={() => setEditing(true)}
                >
                  {field.value ? (
                    <>{format(new Date(field.value), "dd.MM.yyyy")}</>
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
