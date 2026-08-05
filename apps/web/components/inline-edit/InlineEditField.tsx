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
  inputPlaceholder?: string;
  editHint?: string;
  /** Start in edit mode (e.g. after uploading a new document). */
  initialEditing?: boolean;
}

export function InlineEditField({
  value,
  onSave,
  className,
  inputType = "text",
  placeholder = "–",
  inputPlaceholder,
  editHint,
  initialEditing = false,
}: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(initialEditing);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the local draft when the external `value` prop changes (e.g. after a save elsewhere); editValue diverges from value while the user is typing, so it can't be derived in render.
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
          placeholder={inputPlaceholder ?? placeholder}
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
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      title={editHint}
      className={cn(
        "group/edit inline-flex min-w-0 items-center gap-1.5 rounded px-1 -mx-1 py-0.5 -my-0.5 text-left transition-colors hover:bg-muted",
        className,
      )}
    >
      <span className={cn("truncate", !value && "text-muted-foreground")}>
        {value || placeholder}
      </span>
      <Pencil className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/edit:opacity-100" />
    </button>
  );
}
