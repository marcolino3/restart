"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  GripVertical,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
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
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { PageHead } from "@/components/common/PageHead";
import { ROUTES } from "@/constants/routes";
import { handleAction } from "@/lib/actions/handle-action";
import { cn } from "@/lib/utils";

import type { SchoolClassListItem } from "../actions/get-school-classes.action";
import { deleteSchoolClassAction } from "../actions/delete-school-class.action";
import { reorderSchoolClassesAction } from "../actions/reorder-school-classes.action";

interface Props {
  schoolClasses: SchoolClassListItem[];
}

type ViewMode = "cards" | "table";
const VIEW_STORAGE_KEY = "restart-school-classes-view";

const teacherNames = (item: SchoolClassListItem): string[] =>
  (item.teachers ?? [])
    .map((te) =>
      `${te.membership?.user?.firstName ?? ""} ${te.membership?.user?.lastName ?? ""}`.trim(),
    )
    .filter(Boolean);

/** Combined age range over all assigned grade levels (min of mins, max of maxes). */
const ageRange = (
  item: SchoolClassListItem,
): { from: number; to: number } | null => {
  const mins = (item.gradeLevels ?? [])
    .map((gl) => gl.ageMin)
    .filter((v): v is number => v != null);
  const maxes = (item.gradeLevels ?? [])
    .map((gl) => gl.ageMax)
    .filter((v): v is number => v != null);
  if (!mins.length || !maxes.length) return null;
  return { from: Math.min(...mins), to: Math.max(...maxes) };
};

export function SchoolClassesCardGrid({ schoolClasses }: Props) {
  const t = useTranslations("SchoolClasses");
  const locale = useLocale();
  const router = useRouter();

  const [items, setItems] =
    React.useState<SchoolClassListItem[]>(schoolClasses);
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState<ViewMode>("cards");

  React.useEffect(() => {
    setItems(schoolClasses);
  }, [schoolClasses]);

  React.useEffect(() => {
    const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
    if (stored === "table" || stored === "cards") setView(stored);
  }, []);

  const changeView = (next: ViewMode) => {
    setView(next);
    window.localStorage.setItem(VIEW_STORAGE_KEY, next);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? items.filter((item) => {
        const haystack = [
          item.name,
          item.room ?? "",
          ...teacherNames(item),
          ...(item.gradeLevels ?? []).map((gl) => gl.name),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      })
    : items;
  // Reordering a filtered list is ambiguous — drag only on the full list.
  const dndDisabled = normalizedQuery.length > 0;

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = items.map((i) => i.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const nextIds = arrayMove(ids, oldIndex, newIndex);
    setItems((prev) => {
      const byId = new Map(prev.map((p) => [p.id, p]));
      return nextIds.map((id, index) => ({
        ...byId.get(id)!,
        sortOrder: index,
      }));
    });
    void handleAction({
      action: () => reorderSchoolClassesAction(nextIds),
      successMessage: t("schoolClassesReordered"),
      errorMessage: t("reorderError"),
      onSuccess: () => router.refresh(),
    });
  };

  return (
    <div>
      <PageHead
        title={t("schoolClasses")}
        subtitle={t("countSubtitle", { count: items.length })}
        action={
          <Button asChild>
            <Link href={ROUTES.admin.schoolClassesCreate(locale)}>
              <Plus />
              {t("newSchoolClass")}
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <div className="relative w-[280px]">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-9 rounded-full pl-9"
            aria-label={t("searchPlaceholder")}
          />
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <ViewChip
            active={view === "cards"}
            onClick={() => changeView("cards")}
            label={t("viewCards")}
          >
            <LayoutGrid className="size-3.5" />
            {t("viewCards")}
          </ViewChip>
          <ViewChip
            active={view === "table"}
            onClick={() => changeView("table")}
            label={t("viewTable")}
          >
            <List className="size-3.5" />
            {t("viewTable")}
          </ViewChip>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">
          {normalizedQuery
            ? t("noSearchResults", { query: query.trim() })
            : t("noSchoolClassesFound")}
        </p>
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {filtered.map((item) => (
            <SchoolClassCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filtered.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="overflow-hidden rounded-card border bg-card shadow-xs">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-9" aria-label={t("drag")} />
                    <TableHead>{t("schoolClass")}</TableHead>
                    <TableHead>{t("gradeLevel")}</TableHead>
                    <TableHead>{t("teachers")}</TableHead>
                    <TableHead>{t("room")}</TableHead>
                    <TableHead>{t("occupancy")}</TableHead>
                    <TableHead className="w-24" aria-label={t("actions")} />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <SortableClassRow
                      key={item.id}
                      item={item}
                      dndDisabled={dndDisabled}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

/** Filter chip from the design handoff (`.chip` / `.chip.on`). */
function ViewChip({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-[15px] py-[7px] text-[13px] font-medium transition-colors",
        active
          ? "border-primary bg-primary font-semibold text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ClassActionsMenu({ item }: { item: SchoolClassListItem }) {
  const t = useTranslations("SchoolClasses");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const handleDelete = async () => {
    const result = await handleAction({
      action: () => deleteSchoolClassAction(item.id),
      successMessage: t("schoolClassDeleted"),
      errorMessage: t("schoolClassDeleteError"),
      onSuccess: () => router.refresh(),
    });
    return result;
  };

  return (
    <span onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            aria-label={`${tCommon("openMenu")} ${item.name}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link
              href={ROUTES.admin.schoolClassesEdit(locale, item.id)}
              className="flex gap-2"
            >
              <Pencil className="size-4" /> {tCommon("edit")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            {tCommon("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemName={item.name}
        onConfirm={handleDelete}
      />
    </span>
  );
}

function GradeLevelPill({ item }: { item: SchoolClassListItem }) {
  const t = useTranslations("SchoolClasses");
  const range = ageRange(item);
  if (range) {
    return (
      <Badge variant="accent">
        {t("ageShort", { from: range.from, to: range.to })}
      </Badge>
    );
  }
  if ((item.gradeLevels ?? []).length > 0) {
    return (
      <Badge variant="accent">
        {(item.gradeLevels ?? []).map((gl) => gl.name).join(", ")}
      </Badge>
    );
  }
  return null;
}

function SchoolClassCard({ item }: { item: SchoolClassListItem }) {
  const t = useTranslations("SchoolClasses");
  const locale = useLocale();
  const router = useRouter();

  const teachers = teacherNames(item);
  const enrolled = item.enrolledCount ?? 0;
  const capacity = item.maxCapacity ?? null;
  const isFull = capacity != null && enrolled >= capacity;
  const fillPercent =
    capacity != null && capacity > 0
      ? Math.min(100, Math.round((enrolled / capacity) * 100))
      : null;

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={item.name}
      className="cursor-pointer rounded-card border bg-card px-[22px] py-5 shadow-xs transition-colors hover:bg-row-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      onClick={() =>
        router.push(ROUTES.admin.schoolClassesEdit(locale, item.id))
      }
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          router.push(ROUTES.admin.schoolClassesEdit(locale, item.id));
        }
      }}
    >
      <h3 className="mb-1 flex items-center gap-[9px] text-[15px] font-semibold tracking-[-0.01em]">
        {item.color && (
          <i
            className="inline-block size-[9px] shrink-0 rounded-full"
            style={{ background: item.color }}
          />
        )}
        {item.name}
        <span className="ml-auto flex items-center gap-1">
          <GradeLevelPill item={item} />
          <span className="-mr-2">
            <ClassActionsMenu item={item} />
          </span>
        </span>
      </h3>

      <p className="mb-3.5 text-[12.5px] text-muted-foreground">
        {teachers.length > 0 ? (
          teachers.join(" · ")
        ) : (
          <span aria-hidden>—</span>
        )}
      </p>

      {fillPercent != null && (
        <div className="mb-2 h-2 overflow-hidden rounded-full bg-field">
          <i
            className="block h-full rounded-full bg-primary"
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      )}
      <p className="text-[12px] text-muted-foreground">
        {capacity != null
          ? isFull
            ? t("seatsOccupiedFull", { enrolled, capacity })
            : t("seatsOccupied", { enrolled, capacity })
          : t("enrolledCountLabel", { count: enrolled })}
      </p>
    </div>
  );
}

function SortableClassRow({
  item,
  dndDisabled,
}: {
  item: SchoolClassListItem;
  dndDisabled: boolean;
}) {
  const t = useTranslations("SchoolClasses");
  const locale = useLocale();
  const router = useRouter();
  const teachers = teacherNames(item);
  const enrolled = item.enrolledCount ?? 0;
  const capacity = item.maxCapacity ?? null;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: dndDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-pointer",
        isDragging && "relative z-10 bg-row-hover opacity-80",
      )}
      onClick={() =>
        router.push(ROUTES.admin.schoolClassesEdit(locale, item.id))
      }
    >
      <TableCell className="w-9 pr-0" onClick={(e) => e.stopPropagation()}>
        <span
          {...attributes}
          {...listeners}
          className={cn(
            "inline-flex cursor-grab p-1 text-muted-foreground active:cursor-grabbing",
            dndDisabled && "cursor-default opacity-30",
          )}
          aria-label={t("drag")}
        >
          <GripVertical className="size-4" />
        </span>
      </TableCell>
      <TableCell>
        <span className="inline-flex items-center gap-[9px]">
          {item.color && (
            <i
              className="inline-block size-[9px] shrink-0 rounded-full"
              style={{ background: item.color }}
            />
          )}
          <b className="font-semibold">{item.name}</b>
        </span>
      </TableCell>
      <TableCell>
        <GradeLevelPill item={item} />
      </TableCell>
      <TableCell className="text-muted-foreground">
        {teachers.length > 0 ? teachers.join(" · ") : "—"}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {item.room ?? "—"}
      </TableCell>
      <TableCell className="font-mono text-[12.5px] tabular-nums">
        {capacity != null ? `${enrolled}/${capacity}` : enrolled}
      </TableCell>
      <TableCell className="w-24" onClick={(e) => e.stopPropagation()}>
        <span className="flex items-center justify-end">
          <ClassActionsMenu item={item} />
        </span>
      </TableCell>
    </TableRow>
  );
}
