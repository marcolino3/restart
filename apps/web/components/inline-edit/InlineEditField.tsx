"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Check, X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineEditFieldProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  className?: string;
  inputType?: string;
  placeholder?: string;
}

export function InlineEditField({
  value,
  onSave,
  className,
  inputType = "text",
  placeholder = "–",
}: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = useCallback(async () => {
    if (editValue.trim() === value) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(editValue.trim());
      setIsEditing(false);
    } catch {
      setEditValue(value);
      setIsEditing(false);
    }
    setIsSaving(false);
  }, [editValue, value, onSave]);

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1.5 -my-1">
        <Input
          ref={inputRef}
          type={inputType}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={isSaving}
          className="h-7 text-sm px-2 py-1"
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleSave}
          disabled={isSaving}
          className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-green-600"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleCancel}
          className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
        </button>
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
      <span>{value || placeholder}</span>
      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/edit:opacity-100 transition-opacity" />
    </span>
  );
}
