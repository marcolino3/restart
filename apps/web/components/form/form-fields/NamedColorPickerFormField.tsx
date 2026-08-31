"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** Hue keys map to `Common.colorHue.<key>`, shades to `Common.colorShade.<key>`. */
export const NAMED_COLOR_HUES = [
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "indigo",
  "purple",
  "gray",
] as const;
export const NAMED_COLOR_SHADES = ["dark", "mid", "light"] as const;

type Hue = (typeof NAMED_COLOR_HUES)[number];
type Shade = (typeof NAMED_COLOR_SHADES)[number];

/** Rows = shades (dark → light), columns = hues. Muted tones for calendars. */
export const NAMED_COLOR_PALETTE: Record<Hue, Record<Shade, string>> = {
  red: { dark: "#9F2F45", mid: "#C75A6E", light: "#E8A3B0" },
  orange: { dark: "#B85C2E", mid: "#D9804F", light: "#F0B48F" },
  yellow: { dark: "#B48A1F", mid: "#D8AF3E", light: "#F0D07A" },
  green: { dark: "#4E7A3C", mid: "#6C9C5B", light: "#A8CC8E" },
  teal: { dark: "#2E7D6F", mid: "#4F9E90", light: "#9CCFC4" },
  blue: { dark: "#2F6FA8", mid: "#5A94C8", light: "#A3C4E3" },
  indigo: { dark: "#4B4FB0", mid: "#7477D0", light: "#ABAEE6" },
  purple: { dark: "#7A3E9A", mid: "#A26CBF", light: "#CBA3DC" },
  gray: { dark: "#4F5A66", mid: "#7A848F", light: "#B4BCC5" },
};

export function findNamedColor(
  hex: string | null | undefined,
): { hue: Hue; shade: Shade } | null {
  if (!hex) return null;
  const needle = hex.toLowerCase();
  for (const hue of NAMED_COLOR_HUES) {
    for (const shade of NAMED_COLOR_SHADES) {
      if (NAMED_COLOR_PALETTE[hue][shade].toLowerCase() === needle) {
        return { hue, shade };
      }
    }
  }
  return null;
}

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

interface Props {
  name: string;
  label?: string;
  description?: string;
  /** i18n namespace for `label` + `description`. Default `"Common"`. */
  namespace?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Wide colour select: swatch + human-readable name + hex in the trigger, a
 * 9×3 named palette plus a custom hex row in the popover. Colour names come
 * from the `Common` namespace so every feature shares one vocabulary.
 */
export const NamedColorPickerFormField = ({
  name,
  label,
  description,
  namespace = "Common",
  disabled = false,
  className,
}: Props) => {
  const t = useTranslations(namespace);
  const tc = useTranslations("Common");
  const { control } = useFormContext();
  const [open, setOpen] = useState(false);

  const colorName = (hex: string | null | undefined) => {
    const named = findNamedColor(hex);
    if (named) {
      return `${tc(`colorHue.${named.hue}`)} ${tc(`colorShade.${named.shade}`)}`;
    }
    return hex ? tc("colorCustom") : tc("colorNone");
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value: string | null = field.value ?? null;
        return (
          <FormItem className={cn(className, disabled && "opacity-60")}>
            {label && <FormLabel>{t(label)}</FormLabel>}
            <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
              <PopoverTrigger asChild>
                <FormControl>
                  <button
                    type="button"
                    disabled={disabled}
                    aria-haspopup="dialog"
                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full items-center gap-3 rounded-md border px-3 text-sm transition focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "h-5 w-5 shrink-0 rounded",
                        !value &&
                          "border-muted-foreground/40 border border-dashed",
                      )}
                      style={value ? { backgroundColor: value } : undefined}
                    />
                    <span className="flex-1 truncate text-left font-medium">
                      {colorName(value)}
                    </span>
                    {value && (
                      <span className="text-muted-foreground font-mono text-xs uppercase">
                        {value}
                      </span>
                    )}
                    <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
                  </button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] min-w-[20rem] p-3"
                align="start"
              >
                <div className="grid grid-cols-9 gap-2">
                  {NAMED_COLOR_SHADES.map((shade) =>
                    NAMED_COLOR_HUES.map((hue) => {
                      const hex = NAMED_COLOR_PALETTE[hue][shade];
                      const selected =
                        value?.toLowerCase() === hex.toLowerCase();
                      return (
                        <button
                          type="button"
                          key={hex}
                          title={`${tc(`colorHue.${hue}`)} ${tc(`colorShade.${shade}`)}`}
                          aria-label={`${tc(`colorHue.${hue}`)} ${tc(`colorShade.${shade}`)}`}
                          aria-pressed={selected}
                          className={cn(
                            "ring-offset-background focus-visible:ring-ring relative aspect-square w-full rounded-md transition hover:scale-105 focus-visible:ring-2 focus-visible:outline-none",
                            selected && "ring-ring ring-2 ring-offset-2",
                          )}
                          style={{ backgroundColor: hex }}
                          onClick={() => {
                            field.onChange(hex);
                            setOpen(false);
                          }}
                        >
                          {selected && (
                            <Check
                              aria-hidden
                              className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow"
                            />
                          )}
                        </button>
                      );
                    }),
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2 border-t pt-3">
                  <span className="flex-1 text-sm font-medium">
                    {tc("colorCustom")}
                  </span>
                  <Input
                    type="color"
                    value={
                      HEX_RE.test(value ?? "") ? (value as string) : "#6C9C5B"
                    }
                    onChange={(e) =>
                      field.onChange(e.target.value.toUpperCase())
                    }
                    className="h-8 w-10 cursor-pointer p-1"
                    aria-label={tc("colorCustom")}
                  />
                  <Input
                    type="text"
                    value={value ?? ""}
                    onChange={(e) =>
                      field.onChange(e.target.value.toUpperCase() || null)
                    }
                    placeholder="#RRGGBB"
                    className="h-8 w-28 font-mono text-xs"
                    aria-label="Hex"
                  />
                </div>
              </PopoverContent>
            </Popover>
            {description && <FormDescription>{t(description)}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};
