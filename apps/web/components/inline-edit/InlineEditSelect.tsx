"use client";

import { useState, useCallback } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InlineEditSelectProps {
  value: string;
  displayValue: string;
  options: { value: string; label: string }[];
  onSave: (value: string) => Promise<void>;
  className?: string;
  placeholder?: string;
}

export function InlineEditSelect({
  value,
  displayValue,
  options,
  onSave,
  className,
  placeholder = "–",
}: InlineEditSelectProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = useCallback(
    async (newValue: string) => {
      if (newValue === value) {
        setIsEditing(false);
        return;
      }
      setIsSaving(true);
      try {
        await onSave(newValue);
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
        <Select
          defaultValue={value}
          onValueChange={handleChange}
          disabled={isSaving}
          open
          onOpenChange={(open) => {
            if (!open) setIsEditing(false);
          }}
        >
          <SelectTrigger className="h-7 text-sm px-2 w-auto min-w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
