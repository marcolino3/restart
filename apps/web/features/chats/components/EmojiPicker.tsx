"use client";

import { useState } from "react";
import { Smile } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

// A small curated set keeps the bundle tiny (no heavyweight emoji package) and
// covers the everyday reactions a school-team chat needs. Grouped loosely by
// theme; extend freely.
const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: "Smileys",
    emojis: [
      "😀", "😄", "😅", "😂", "🙂", "😉", "😍", "😘", "😎", "🤔",
      "😐", "😴", "😢", "😭", "😤", "😳", "🥳", "😇", "🤗", "🙃",
    ],
  },
  {
    label: "Gesten",
    emojis: [
      "👍", "👎", "👏", "🙌", "🙏", "👋", "🤝", "💪", "👌", "✌️",
      "🤞", "👀", "🫶", "❤️", "🔥", "✨", "🎉", "✅", "❌", "⭐",
    ],
  },
  {
    label: "Schule",
    emojis: [
      "📚", "✏️", "📝", "📅", "📌", "📎", "🎒", "🏫", "🧑‍🏫", "🎨",
      "⚽", "🍎", "☀️", "☕", "🕐", "📣", "💡", "🎵", "🧩", "🏆",
    ],
  },
];

interface Props {
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({ onSelect }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="shrink-0 text-muted-foreground"
          aria-label="Emoji"
        >
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        className="w-72 p-2"
      >
        <div className="max-h-64 space-y-3 overflow-y-auto">
          {EMOJI_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-1 text-[11px] font-medium text-muted-foreground">
                {group.label}
              </p>
              <div className="grid grid-cols-8 gap-0.5">
                {group.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onSelect(emoji);
                      setOpen(false);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-lg transition hover:bg-muted"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
