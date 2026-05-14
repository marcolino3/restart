"use client";

import { useState, useCallback } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface InlineEditDateProps {
  value: string | null | undefined;
  displayValue: string;
  onSave: (value: string) => Promise<void>;
  className?: string;
  placeholder?: string;
}

export function InlineEditDate({
  value,
  displayValue,
  onSave,
  className,
  placeholder = "–",
}: InlineEditDateProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentDate = value ? new Date(value) : undefined;

  const handleSelect = useCallback(
    async (date: Date | undefined) => {
      if (!date) return;
      const dateStr = format(date, "yyyy-MM-dd");
      if (dateStr === value) {
        setIsEditing(false);
        return;
      }
      setIsSaving(true);
      try {
        await onSave(dateStr);
        setIsEditing(false);
      } catch {
        setIsEditing(false);
      }
      setIsSaving(false);
    },
    [value, onSave],
  );

  if (isEditing) {
    return (
      <div className="-my-1">
        <Popover
          open
          onOpenChange={(open) => {
            if (!open) setIsEditing(false);
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={isSaving}
              className={cn(
                "h-7 text-sm px-2 font-normal",
                !currentDate && "text-muted-foreground",
              )}
            >
              {currentDate
                ? format(currentDate, "PPP", { locale: de })
                : placeholder}
              <CalendarIcon className="ml-2 h-3.5 w-3.5 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={currentDate}
              onSelect={handleSelect}
              disabled={(date) =>
                date > new Date() || date < new Date("1900-01-01")
              }
              captionLayout="dropdown"
              locale={de}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <span
      onDoubleClick={() => setIsEditing(true)}
      className={cn(
        "group/edit inline-flex items-center gap-1.5 cursor-pointer rounded px-1 -mx-1 py-0.5 -my-0.5 hover:bg-muted transition-colors",
        className,
      )}
    >
      <span>{displayValue || placeholder}</span>
      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/edit:opacity-100 transition-opacity" />
    </span>
  );
}
