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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Check, XCircle, CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface Props {
  name: string;
  label: string;
  onSave: (value: Date) => Promise<boolean>;
}

export const CalendarDateTimeFormField = ({ name, label, onSave }: Props) => {
  const { control, getValues } = useFormContext();
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle"
  );
  const [editing, setEditing] = useState(false);
  const [time, setTime] = useState("");

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
                <div className="flex gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-[180px] justify-start"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value
                          ? format(new Date(field.value), "dd.MM.yyyy")
                          : "Datum wählen"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          if (!date) return;
                          const [hh, mm] = time.split(":");
                          const updated = new Date(date);
                          updated.setHours(Number(hh), Number(mm) || 0);
                          field.onChange(updated);
                          setStatus("saving");
                          onSave(updated).then((ok) => {
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

                  <Input
                    type="time"
                    step="60"
                    value={time}
                    onChange={(e) => {
                      setTime(e.target.value);
                    }}
                    onBlur={() => {
                      const date = field.value;
                      if (!date || !time) return;
                      const [hh, mm] = time.split(":");
                      const updated = new Date(date);
                      updated.setHours(Number(hh), Number(mm));
                      field.onChange(updated);
                      setStatus("saving");
                      onSave(updated).then((ok) => {
                        setStatus(ok ? "success" : "error");
                        setTimeout(() => setStatus("idle"), 2000);
                        setEditing(false);
                      });
                    }}
                  />
                </div>
              ) : (
                <div
                  className="min-h-[38px] px-2 py-1 text-sm bg-muted rounded-md cursor-pointer w-full flex items-center border border-transparent hover:border-dashed hover:border-gray-400 transition-colors"
                  onClick={() => {
                    const val = getValues(name);
                    if (val instanceof Date) {
                      setTime(format(val, "HH:mm"));
                    }
                    setEditing(true);
                  }}
                >
                  {field.value ? (
                    <>{format(field.value, "dd.MM.yyyy HH:mm")}</>
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
