"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { ComboboxFormField } from "@/components/form/form-fields/ComboboxFormField";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { handleAction } from "@/lib/actions/handle-action";

import { createProjectAction } from "../actions/create-project.action";
import { updateProjectAction } from "../actions/update-project.action";
import {
  ProjectFormSchema,
  type ProjectFormOutput,
} from "../schemas/project-form.schema";
import { PROJECT_STATUSES, type MembershipRef, type ProjectDetail } from "../types";
import { membershipName } from "../lib/membership-name";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  project?: ProjectDetail;
  orgMemberships?: MembershipRef[];
  onSaved?: () => void;
};

export function ProjectFormDialog({
  open,
  onOpenChange,
  mode,
  project,
  orgMemberships = [],
  onSaved,
}: Props) {
  const t = useTranslations("Projects");
  const tc = useTranslations("Common");
  const router = useRouter();
  const isEdit = mode === "edit";

  const form = useForm<ProjectFormOutput>({
    resolver: zodResolver(ProjectFormSchema),
    defaultValues: {
      title: project?.title ?? "",
      description: project?.description ?? "",
      status: project?.status ?? "ACTIVE",
      color: project?.color ?? null,
      memberMembershipIds: [],
    },
  });

  const memberOptions = orgMemberships.map((m) => ({
    value: m.id,
    label: membershipName(m),
  }));

  const onSubmit = async (values: ProjectFormOutput) => {
    const result = await handleAction({
      action: () =>
        isEdit && project
          ? updateProjectAction(project.id, values)
          : createProjectAction(values),
      successMessage: isEdit ? t("projectUpdated") : t("projectCreated"),
      errorMessage: isEdit ? t("projectUpdateError") : t("projectCreateError"),
    });
    if (result.success) {
      onOpenChange(false);
      form.reset();
      onSaved?.();
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("editProject") : t("newProject")}
          </DialogTitle>
          <DialogDescription>{t("projectFormSubtitle")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <InputFormField name="title" label="title" namespace="Projects" />
            <TextareaFormField
              name="description"
              label="description"
              namespace="Projects"
            />
            <SelectFormField
              name="status"
              label="status"
              namespace="Projects"
              options={PROJECT_STATUSES.map((s) => ({
                value: s,
                label: `status_${s}`,
              }))}
            />
            {!isEdit && memberOptions.length > 0 && (
              <ComboboxFormField
                name="memberMembershipIds"
                label="members"
                namespace="Projects"
                multiple
                translateOptions={false}
                options={memberOptions}
              />
            )}

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {tc("save")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
