"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
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
import { GripVertical, Lock, Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ROUTES } from "@/constants/routes";
import { ArchiveConfirmationDialog } from "@/components/common/ArchiveConfirmationDialog";
import { handleAction } from "@/lib/actions/handle-action";

import { pickAbsenceCategoryName, type AbsenceCategoryItem } from "../types";
import { setEmployeeAbsenceCategoryActiveAction } from "../actions/set-employee-absence-category-active.action";
import { archiveEmployeeAbsenceCategoryAction } from "../actions/archive-employee-absence-category.action";
import { reorderEmployeeAbsenceCategoriesAction } from "../actions/reorder-employee-absence-categories.action";

interface Props {
  initialItems: AbsenceCategoryItem[];
}

export function AbsenceCategoriesTable({ initialItems }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("AbsenceCategories");
  const [items, setItems] = useState(initialItems);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const toggleActive = (item: AbsenceCategoryItem, next: boolean) => {
    setPendingId(item.id);
    startTransition(async () => {
      await handleAction({
        action: () => setEmployeeAbsenceCategoryActiveAction(item.id, next),
        successMessage: next ? t("activatedToast") : t("deactivatedToast"),
        errorMessage: t("toggleError"),
        onSuccess: () => {
          setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, isActive: next } : i)),
          );
        },
      });
      setPendingId(null);
    });
  };

  const archive = async (item: AbsenceCategoryItem) => {
    const res = await archiveEmployeeAbsenceCategoryAction(item.id);
    if (res.success) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      return { success: true as const };
    }
    return {
      success: false as const,
      error: String((res as { error?: unknown }).error ?? ""),
    };
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = items.map((i) => i.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const nextIds = arrayMove(ids, oldIndex, newIndex);
    const previous = items;
    setItems((prev) => {
      const byId = new Map(prev.map((p) => [p.id, p]));
      return nextIds.map((id, index) => ({
        ...byId.get(id)!,
        sortOrder: index,
      }));
    });
    void handleAction({
      action: () => reorderEmployeeAbsenceCategoriesAction(nextIds),
      successMessage: t("reorderedToast"),
      errorMessage: t("reorderError"),
      onSuccess: () => router.refresh(),
    }).then((res) => {
      if (!res.success) setItems(previous);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button
          onClick={() =>
            router.push(ROUTES.admin.absenceCategoriesCreate(locale))
          }
        >
          <Plus className="mr-1 h-4 w-4" />
          {t("createNew")}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="w-[280px]">{t("colName")}</TableHead>
              <TableHead>{t("colBehavior")}</TableHead>
              <TableHead className="w-[180px]">{t("colLimits")}</TableHead>
              <TableHead className="w-[100px] text-center">
                {t("colActive")}
              </TableHead>
              <TableHead className="w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground text-center"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={items.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {items.map((item) => (
                    <SortableTableRow
                      key={item.id}
                      item={item}
                      locale={locale}
                      pendingToggle={pendingId === item.id}
                      onToggleActive={(v) => toggleActive(item, v)}
                      onArchive={() => archive(item)}
                      onEdit={() =>
                        router.push(
                          ROUTES.admin.absenceCategoriesEdit(locale, item.id),
                        )
                      }
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

interface SortableRowProps {
  item: AbsenceCategoryItem;
  locale: string;
  pendingToggle: boolean;
  onToggleActive: (v: boolean) => void;
  onArchive: () => Promise<{ success: boolean; error?: unknown }>;
  onEdit: () => void;
}

function SortableTableRow({
  item,
  locale,
  pendingToggle,
  onToggleActive,
  onArchive,
  onEdit,
}: SortableRowProps) {
  const t = useTranslations("AbsenceCategories");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-50" : ""}
    >
      <TableCell className="w-[40px]">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-muted-foreground hover:text-foreground cursor-grab p-1 active:cursor-grabbing"
          aria-label={t("drag")}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {item.color && (
            <span
              aria-hidden
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
          )}
          <span className="font-medium">
            {pickAbsenceCategoryName(item, locale)}
          </span>
          {item.isSystem && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Lock className="text-muted-foreground h-3.5 w-3.5" />
              </TooltipTrigger>
              <TooltipContent>{t("systemLocked")}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {item.countsAsWorkTime && (
            <Badge variant="secondary">{t("badgeCountsWork")}</Badge>
          )}
          {item.isPaid && <Badge variant="secondary">{t("badgePaid")}</Badge>}
          {!item.defaultIsVacationCapable && (
            <Badge variant="outline">{t("badgeNotVacationCapable")}</Badge>
          )}
          {item.requiresCertificate && (
            <Badge variant="outline">{t("badgeCertificate")}</Badge>
          )}
          {item.requiresApproval && (
            <Badge variant="outline">{t("badgeApproval")}</Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {item.maxDaysPerYear && (
          <div>{t("limitMaxDays", { n: item.maxDaysPerYear })}</div>
        )}
        {item.certificateRequiredFromDay && (
          <div>
            {t("limitCertificateFromDay", {
              n: item.certificateRequiredFromDay,
            })}
          </div>
        )}
        {item.defaultPercentage !== 100 && (
          <div>
            {t("limitDefaultPercentage", { n: item.defaultPercentage })}
          </div>
        )}
      </TableCell>
      <TableCell className="text-center">
        <Switch
          checked={item.isActive}
          disabled={pendingToggle}
          onCheckedChange={onToggleActive}
        />
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          {!item.isSystem && (
            <ArchiveConfirmationDialog
              title={t("archiveTitle")}
              description={t("archiveDescription", {
                name: pickAbsenceCategoryName(item, locale),
              })}
              onConfirm={onArchive}
            />
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
