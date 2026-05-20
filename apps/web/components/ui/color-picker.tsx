"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Default colour palette aligned with the Tailwind 500-shade family. Tuned to
 * read well on both light and dark themes — most are saturated enough to pop
 * against a card background without screaming.
 */
export const DEFAULT_COLOR_PRESETS = [
  "#94A3B8", // slate
  "#64748B", // slate dark
  "#0EA5E9", // sky
  "#3B82F6", // blue
  "#6366F1", // indigo
  "#8B5CF6", // violet
  "#A855F7", // purple
  "#D946EF", // fuchsia
  "#EC4899", // pink
  "#EF4444", // red
  "#F97316", // orange
  "#F59E0B", // amber
  "#EAB308", // yellow
  "#84CC16", // lime
  "#22C55E", // green
  "#10B981", // emerald
  "#14B8A6", // teal
  "#06B6D4", // cyan
];

export interface ColorPickerProps {
  value: string | null | undefined;
  onChange: (next: string | null) => void;
  presets?: string[];
  allowClear?: boolean;
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
  /** Disable the trigger and prevent opening. */
  disabled?: boolean;
}

/**
 * Compact colour picker. Trigger is a swatch button; popover content shows a
 * preset palette plus a free-form hex/native picker fallback. Designed to be
 * reused for stages, grade levels, school classes, etc.
 */
export function ColorPicker({
  value,
  onChange,
  presets = DEFAULT_COLOR_PRESETS,
  allowClear = false,
  size = "md",
  className,
  ariaLabel,
  disabled,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const dim = size === "sm" ? "h-6 w-6" : "h-8 w-8";
  return (
    <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={ariaLabel ?? "Pick color"}
          className={cn(
            "relative shrink-0 rounded-md border bg-muted ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            dim,
            className,
          )}
          style={value ? { backgroundColor: value } : undefined}
        >
          {!value && (
            <span
              aria-hidden
              className="absolute inset-1 rounded-sm border border-dashed border-muted-foreground/40"
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="grid grid-cols-9 gap-1.5">
          {presets.map((c) => {
            const selected = value?.toLowerCase() === c.toLowerCase();
            return (
              <button
                type="button"
                key={c}
                className={cn(
                  "relative h-6 w-6 rounded-md border ring-offset-background transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected && "ring-2 ring-ring",
                )}
                style={{ backgroundColor: c }}
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
                aria-label={c}
                aria-pressed={selected}
              >
                {selected && (
                  <Check
                    aria-hidden
                    className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow"
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-2 border-t pt-3">
          <Input
            type="color"
            value={value ?? "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-12 cursor-pointer p-1"
            aria-label="Eigene Farbe"
          />
          <Input
            type="text"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder="#RRGGBB"
            className="h-8 flex-1 font-mono text-xs"
          />
          {allowClear && value && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              aria-label="Farbe entfernen"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
