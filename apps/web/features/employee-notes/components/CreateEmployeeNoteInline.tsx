"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createEmployeeNoteAction } from "../actions/create-employee-note.action";

const CATEGORIES = [
  "GENERAL",
  "WARNING",
  "MEETING",
  "CONTRACT",
  "REQUEST",
  "PERFORMANCE",
  "OTHER",
] as const;

interface CreateEmployeeNoteInlineProps {
  employeeId: string;
}

export default function CreateEmployeeNoteInline({
  employeeId,
}: CreateEmployeeNoteInlineProps) {
  const t = useTranslations("EmployeeNotes");
  const tC = useTranslations("Common");
  const router = useRouter();

  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("GENERAL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || !title.trim()) return;

    setIsSubmitting(true);
    const result = await createEmployeeNoteAction({
      employeeId,
      category,
      title: title.trim(),
      content: content.trim(),
      date: new Date().toISOString().split("T")[0],
    });

    if (result.success) {
      toast.success(t("noteCreated"));
      setContent("");
      setTitle("");
      setCategory("GENERAL");
      router.refresh();
    } else {
      toast.error(t("noteCreateError"));
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-w-0 flex-1">
      <div className="relative">
        <div className="rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          {/* Title input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("titlePlaceholder")}
            className="block w-full border-b border-input bg-transparent px-3 py-2 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
          />

          {/* Content textarea */}
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("contentPlaceholder")}
            className="block w-full resize-none bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />

          {/* Spacer for toolbar */}
          <div aria-hidden="true" className="py-2">
            <div className="py-px">
              <div className="h-9" />
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="absolute inset-x-0 bottom-0 flex justify-between py-2 pr-2 pl-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Tag className="h-4 w-4" />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {tC(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="shrink-0">
            <Button
              size="sm"
              disabled={!content.trim() || !title.trim() || isSubmitting}
              onClick={handleSubmit}
            >
              {t("post")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
