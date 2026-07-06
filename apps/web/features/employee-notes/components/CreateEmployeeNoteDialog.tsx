"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { SwitchFormField } from "@/components/form/form-fields/SwitchFormField";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
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

const CreateNoteSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().min(1),
  content: z.string().min(1),
  isConfidential: z.boolean(),
  date: z.date().nullable(),
});

type CreateNoteFormValues = z.infer<typeof CreateNoteSchema>;

interface CreateEmployeeNoteDialogProps {
  employeeId: string;
}

export default function CreateEmployeeNoteDialog({
  employeeId,
}: CreateEmployeeNoteDialogProps) {
  const t = useTranslations("EmployeeNotes");
  const tC = useTranslations("Common");
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const form = useForm<CreateNoteFormValues>({
    resolver: zodResolver(CreateNoteSchema),
    defaultValues: {
      title: "",
      category: "GENERAL",
      content: "",
      isConfidential: false,
      date: new Date(),
    },
  });

  const categoryOptions = CATEGORIES.map((cat) => ({
    value: cat,
    label: cat,
  }));

  const onSubmit = async (values: CreateNoteFormValues) => {
    const dateStr = values.date
      ? values.date.toISOString().split("T")[0]
      : undefined;

    const result = await createEmployeeNoteAction({
      employeeId,
      category: values.category,
      title: values.title,
      content: values.content,
      isConfidential: values.isConfidential,
      ...(dateStr ? { date: dateStr } : {}),
    });

    if (result.success) {
      toast.success(t("noteCreated"));
      form.reset();
      setOpen(false);
      router.refresh();
    } else {
      toast.error(t("noteCreateError"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          {t("createNote")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("createNote")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <InputFormField name="title" label="noteTitle" />
            <div className="flex gap-4">
              <SelectFormField
                name="category"
                label="category"
                options={categoryOptions}
                width="w-1/2"
              />
              <div className="w-1/2">
                <DatePickerFormField
                  name="date"
                  label="date"
                  disabledDate={(date) =>
                    date > new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                  }
                />
              </div>
            </div>
            <TextareaFormField name="content" label="noteContent" />
            <SwitchFormField
              name="isConfidential"
              label="confidential"
              description="confidentialDescription"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {tC("cancel")}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {tC("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
