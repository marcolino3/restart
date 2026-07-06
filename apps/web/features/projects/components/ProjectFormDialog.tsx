"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { ComboboxFormField } from "@/components/form/form-fields/ComboboxFormField";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { handleAction } from "@/lib/actions/handle-action";
import { cn } from "@/lib/utils";

import { createFromTemplateAction } from "../actions/create-from-template.action";
import { createProjectAction } from "../actions/create-project.action";
import { updateProjectAction } from "../actions/update-project.action";
import {
  ProjectFormSchema,
  type ProjectFormOutput,
} from "../schemas/project-form.schema";
import {
  PROJECT_STATUSES,
  type MembershipRef,
  type ProjectDetail,
  type ProjectTemplate,
} from "../types";
import { membershipName } from "../lib/membership-name";

/** Date → ISO date string (YYYY-MM-DD) without timezone drift. */
function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Due dates lie in the future — only guard against nonsense values.
const dueDateDisabled = (date: Date) => date < new Date("1900-01-01");

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  project?: ProjectDetail;
  orgMemberships?: MembershipRef[];
  templates?: ProjectTemplate[];
  onSaved?: () => void;
};

export function ProjectFormDialog({
  open,
  onOpenChange,
  mode,
  project,
  orgMemberships = [],
  templates = [],
  onSaved,
}: Props) {
  const t = useTranslations("Projects");
  const tc = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const isEdit = mode === "edit";

  const form = useForm<ProjectFormOutput>({
    resolver: zodResolver(ProjectFormSchema),
    defaultValues: {
      title: project?.title ?? "",
      description: project?.description ?? "",
      status: project?.status ?? "ACTIVE",
      color: project?.color ?? null,
      dueDate: project?.dueDate ? new Date(project.dueDate) : null,
      memberMembershipIds: [],
      templateId: null,
    },
  });

  const templateId = form.watch("templateId") ?? null;

  const memberOptions = orgMemberships.map((m) => ({
    value: m.id,
    label: membershipName(m),
  }));

  const onSubmit = async (values: ProjectFormOutput) => {
    const dueDate = values.dueDate ? toIsoDate(values.dueDate) : null;
    const fromTemplate = !isEdit && !!values.templateId;

    const result = await handleAction({
      action: () => {
        if (isEdit && project) return updateProjectAction(project.id, values);
        if (fromTemplate) {
          return createFromTemplateAction({
            templateId: values.templateId as string,
            title: values.title,
            description: values.description ?? null,
            dueDate,
            memberMembershipIds: values.memberMembershipIds ?? [],
          });
        }
        return createProjectAction(values);
      },
      successMessage: isEdit ? t("projectUpdated") : t("projectCreated"),
      errorMessage: isEdit ? t("projectUpdateError") : t("projectCreateError"),
    });
    if (result.success) {
      onOpenChange(false);
      form.reset();
      onSaved?.();
      if (!isEdit && result.data.id) {
        router.push(ROUTES.admin.projectsBoard(locale, result.data.id));
      }
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isEdit ? "sm:max-w-lg" : "sm:max-w-3xl"}>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("editProject") : t("newProject")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("projectFormSubtitle") : t("newProjectHint")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {isEdit ? (
              <>
                <InputFormField
                  name="title"
                  label="title"
                  namespace="Projects"
                />
                <DatePickerFormField
                  name="dueDate"
                  label="dueDateOptional"
                  namespace="Projects"
                  disabledDate={dueDateDisabled}
                />
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
              </>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_1.2fr]">
                {/* Left column — template picker (radio-like cards). */}
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">{t("template")}</p>
                  <div className="flex flex-col gap-2.5">
                    <TemplateCard
                      title={t("blankProject")}
                      hint={t("blankProjectHint")}
                      selected={!templateId}
                      onSelect={() =>
                        form.setValue("templateId", null, {
                          shouldDirty: true,
                        })
                      }
                    />
                    {templates.map((tpl) => (
                      <TemplateCard
                        key={tpl.id}
                        title={tpl.title}
                        hint={
                          tpl.description
                            ? `${t("templateTaskCount", {
                                count: tpl.tasks?.length ?? 0,
                              })} · ${tpl.description}`
                            : t("templateTaskCount", {
                                count: tpl.tasks?.length ?? 0,
                              })
                        }
                        selected={templateId === tpl.id}
                        onSelect={() =>
                          form.setValue("templateId", tpl.id, {
                            shouldDirty: true,
                          })
                        }
                      />
                    ))}
                  </div>
                </div>

                {/* Right column — project fields. */}
                <div className="space-y-4 md:border-l md:pl-6">
                  <InputFormField
                    name="title"
                    label="title"
                    namespace="Projects"
                  />
                  <DatePickerFormField
                    name="dueDate"
                    label="dueDateOptional"
                    namespace="Projects"
                    disabledDate={dueDateDisabled}
                  />
                  <TextareaFormField
                    name="description"
                    label="description"
                    namespace="Projects"
                  />
                  {memberOptions.length > 0 && (
                    <ComboboxFormField
                      name="memberMembershipIds"
                      label="members"
                      namespace="Projects"
                      multiple
                      translateOptions={false}
                      options={memberOptions}
                    />
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {isEdit ? tc("save") : t("createProject")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function TemplateCard({
  title,
  hint,
  selected,
  onSelect,
}: {
  title: string;
  hint: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/60",
        selected && "border-primary ring-1 ring-primary"
      )}
    >
      <span className="block text-sm font-semibold">{title}</span>
      <span className="mt-0.5 block text-xs text-muted-foreground">
        {hint}
      </span>
    </button>
  );
}
