"use client";

import { useState } from "react";
import {
  useFieldArray,
  useFormContext,
  useWatch,
  type Control,
} from "react-hook-form";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronRight, GripVertical, Plus, X } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";

/** Sentinel for "no selection" — Radix Select items cannot use an empty value. */
export const NONE = "__none__";

export const ContactSchema = z.object({
  /** null = new person added in this dialog, created on save. */
  id: z.string().nullable(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().or(z.literal("")),
  phone: z.string(),
  mobile: z.string(),
  role: z.string(),
});

export type ContactFormValues = z.infer<typeof ContactSchema>;

export const EMPTY_CONTACT: ContactFormValues = {
  id: null,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  mobile: "",
  role: "MOTHER",
};

/** True when any of the row's user-editable text fields has content. */
export const contactRowFilled = (c: ContactFormValues): boolean =>
  Boolean(
    c.firstName.trim() ||
      c.lastName.trim() ||
      c.email.trim() ||
      c.phone.trim() ||
      c.mobile.trim(),
  );

/**
 * Shared superRefine for `contacts` arrays: existing persons and non-empty
 * new persons need first + last name. A completely empty new row is allowed —
 * it is skipped on save.
 */
export const refineContacts = (
  contacts: ContactFormValues[],
  ctx: z.RefinementCtx,
): void => {
  contacts.forEach((c, i) => {
    if (!c.id && !contactRowFilled(c)) return;
    if (!c.firstName.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Required",
        path: ["contacts", i, "firstName"],
      });
    }
    if (!c.lastName.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Required",
        path: ["contacts", i, "lastName"],
      });
    }
  });
};

/** Minimal form shape the field array operates on. */
type ContactsFormShape = { contacts: ContactFormValues[] };

interface SortableContactCardProps {
  sortableId: string;
  index: number;
  control: Control<ContactsFormShape>;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onRemove: () => void;
  roleOptions: { value: string; label: string }[];
}

/**
 * One contact person card: draggable via the grip handle (list order =
 * priority), collapsible via the chevron, removable via the X button.
 * Only the grip receives the dnd listeners so the inputs stay clickable.
 */
function SortableContactCard({
  sortableId,
  index,
  control,
  collapsed,
  onToggleCollapsed,
  onRemove,
  roleOptions,
}: SortableContactCardProps) {
  const t = useTranslations("Admissions");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Compact summary (name + role) shown while the card is collapsed.
  const row = useWatch({ control, name: `contacts.${index}` });
  const name = [row?.firstName, row?.lastName]
    .map((v) => v?.trim())
    .filter(Boolean)
    .join(" ");
  const roleLabel =
    row?.role && row.role !== NONE
      ? (roleOptions.find((o) => o.value === row.role)?.label ?? row.role)
      : null;
  const summary = [name, roleLabel].filter(Boolean).join(" · ");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`space-y-3 rounded-md border border-border bg-background p-3 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
          aria-label={t("dragContact")}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? t("expandContact") : t("collapseContact")}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </Button>
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-muted-foreground">
          {t("contactPersonLabel")} {index + 1}
          {index === 0 ? ` · ${t("primaryContactBadge")}` : ""}
          {collapsed && summary ? (
            <span className="ml-2 font-normal">{summary}</span>
          ) : null}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          aria-label={t("removeContactPerson")}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      {!collapsed && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <InputFormField
              name={`contacts.${index}.firstName`}
              label="firstName"
            />
            <InputFormField
              name={`contacts.${index}.lastName`}
              label="lastName"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputFormField
              name={`contacts.${index}.email`}
              label="email"
              type="email"
            />
            <SelectFormField
              name={`contacts.${index}.role`}
              label="role"
              options={roleOptions}
              translateOptions={false}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputFormField name={`contacts.${index}.phone`} label="phone" />
            <InputFormField name={`contacts.${index}.mobile`} label="mobile" />
          </div>
        </>
      )}
    </div>
  );
}

interface ContactPersonsFieldArrayProps {
  roleOptions: { value: string; label: string }[];
  /**
   * Called when a row with an existing `id` is removed from the list.
   * The edit dialog collects these ids and archives them on save; the
   * create dialog has no existing persons and can omit this.
   */
  onRemoveExisting?: (id: string) => void;
}

/**
 * The "Bezugspersonen" list shared by the create and edit application
 * dialogs: dnd-kit sortable cards (list order = priority, index 0 is the
 * primary contact), collapsible rows and an add button. Must be rendered
 * inside a RHF <Form> whose values contain `contacts: ContactFormValues[]`.
 */
export function ContactPersonsFieldArray({
  roleOptions,
  onRemoveExisting,
}: ContactPersonsFieldArrayProps) {
  const t = useTranslations("Admissions");
  const form = useFormContext<ContactsFormShape>();

  const { fields, append, move, remove } = useFieldArray({
    control: form.control,
    name: "contacts",
    keyName: "key",
  });

  // Collapsed cards, keyed by the stable RHF field key. On mount, every
  // person except the first (primary contact) starts collapsed; newly
  // appended rows are not in the set, i.e. open.
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(
    () => new Set(fields.slice(1).map((f) => f.key)),
  );
  const toggleCollapsed = (key: string) =>
    setCollapsedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const onContactDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = fields.findIndex((f) => f.key === active.id);
    const to = fields.findIndex((f) => f.key === over.id);
    if (from === -1 || to === -1) return;
    move(from, to);
  };

  const removeContact = (index: number) => {
    const id = form.getValues(`contacts.${index}.id`);
    if (id) onRemoveExisting?.(id);
    remove(index);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onContactDragEnd}
      >
        <SortableContext
          items={fields.map((f) => f.key)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3.5">
            {fields.map((field, index) => (
              <SortableContactCard
                key={field.key}
                sortableId={field.key}
                index={index}
                control={form.control}
                collapsed={collapsedKeys.has(field.key)}
                onToggleCollapsed={() => toggleCollapsed(field.key)}
                onRemove={() => removeContact(index)}
                roleOptions={roleOptions}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ ...EMPTY_CONTACT })}
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        {t("addContactPerson")}
      </Button>
    </>
  );
}
