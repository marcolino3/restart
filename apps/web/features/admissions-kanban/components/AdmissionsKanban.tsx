"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Kanban,
  Layers,
  LayoutList,
  Bell,
  Mail,
  Plus,
  Users2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { moveApplicationAction } from "../actions/move-application.action";
import { reorderAdmissionStagesAction } from "../actions/stage-actions";
import type { KanbanApplication, KanbanStage } from "../types";
import { AdmissionCardVisual } from "./AdmissionCard";
import { AdmissionsList } from "./AdmissionsList";
import { CreateApplicationDialog } from "./CreateApplicationDialog";
import { ManageStagesDialog } from "./ManageStagesDialog";

const COLLAPSED_KEY = "admissions-kanban:collapsed-stages";
const VIEW_KEY = "admissions-kanban:view";

interface Props {
  initialStages: KanbanStage[];
  initialApplications: KanbanApplication[];
  canCreate: boolean;
  canMove: boolean;
  canEnroll: boolean;
  canWrite: boolean;
  canManageStages: boolean;
}

type ColumnState = {
  id: string;
  appIds: string[];
};

const COLUMN_MIN_HEIGHT = "min-h-[300px]";

export function AdmissionsKanban({
  initialStages,
  initialApplications,
  canCreate,
  canMove,
  canManageStages,
}: Props) {
  const t = useTranslations("Admissions");
  const router = useRouter();
  const [, startTransition] = useTransition();

  const openApplication = (id: string) => {
    router.push(`/admin/admissions/${id}`);
  };

  const [applicationsById, setApplicationsById] = useState<
    Record<string, KanbanApplication>
  >(() => Object.fromEntries(initialApplications.map((a) => [a.id, a])));

  const [columns, setColumns] = useState<Record<string, ColumnState>>(() => {
    const map: Record<string, ColumnState> = {};
    for (const s of initialStages) map[s.id] = { id: s.id, appIds: [] };
    const sorted = [...initialApplications].sort(
      (a, b) => a.position - b.position,
    );
    for (const a of sorted) {
      if (!map[a.admissionStageId]) {
        map[a.admissionStageId] = { id: a.admissionStageId, appIds: [] };
      }
      map[a.admissionStageId].appIds.push(a.id);
    }
    return map;
  });

  const [search, setSearch] = useState("");
  const [activeApp, setActiveApp] = useState<KanbanApplication | null>(null);
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showStages, setShowStages] = useState(false);

  // Local stage ordering — mirrors the backend order on first render but can
  // be reordered by drag-and-drop. Persisted indirectly via the backend
  // (`reorderAdmissionStagesAction`) so a refresh reflects the change.
  const [stageOrder, setStageOrder] = useState<KanbanStage[]>(initialStages);

  // View mode (board / list) and per-stage collapse state — both persisted
  // in localStorage so the user's preference survives reloads.
  const [view, setView] = useState<"board" | "list">("board");
  const [collapsedStages, setCollapsedStages] = useState<Set<string>>(
    () => new Set(),
  );

  // @dnd-kit assigns internal ids (`aria-describedby="DndDescribedBy-N"`) via
  // an in-module counter that drifts between SSR and client hydration. Render
  // the DnD tree only after mount to keep the markup deterministic.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const v = window.localStorage.getItem(VIEW_KEY);
      if (v === "board" || v === "list") setView(v);
      const c = window.localStorage.getItem(COLLAPSED_KEY);
      if (c) {
        try {
          const arr = JSON.parse(c) as string[];
          if (Array.isArray(arr)) setCollapsedStages(new Set(arr));
        } catch {
          /* ignore corrupt JSON */
        }
      }
    }
  }, []);

  // Persist view + collapsed-stage prefs.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(VIEW_KEY, view);
  }, [view]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      COLLAPSED_KEY,
      JSON.stringify(Array.from(collapsedStages)),
    );
  }, [collapsedStages]);

  // Re-sync stage order if the prop changes (e.g. after stage add/remove).
  useEffect(() => {
    setStageOrder(initialStages);
  }, [initialStages]);

  const toggleCollapsed = (stageId: string) =>
    setCollapsedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) next.delete(stageId);
      else next.add(stageId);
      return next;
    });

  // Re-sync local state when server props change (after router.refresh from a
  // successful create / move / delete / enroll). Initial `useState` only runs
  // on mount, so without this, new applications would not show up until full
  // page reload. We compare by id + position + stage to avoid unnecessary
  // resets that would clobber an in-flight optimistic DnD move.
  const lastSignatureRef = useRef("");
  useEffect(() => {
    const signature = initialApplications
      .map((a) => `${a.id}:${a.admissionStageId}:${a.position}`)
      .sort()
      .join("|");
    if (signature === lastSignatureRef.current) return;
    lastSignatureRef.current = signature;

    setApplicationsById(
      Object.fromEntries(initialApplications.map((a) => [a.id, a])),
    );
    setColumns(() => {
      const map: Record<string, ColumnState> = {};
      for (const s of initialStages) map[s.id] = { id: s.id, appIds: [] };
      const sorted = [...initialApplications].sort(
        (a, b) => a.position - b.position,
      );
      for (const a of sorted) {
        if (!map[a.admissionStageId]) {
          map[a.admissionStageId] = { id: a.admissionStageId, appIds: [] };
        }
        map[a.admissionStageId].appIds.push(a.id);
      }
      return map;
    });
  }, [initialApplications, initialStages]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const searchLc = search.trim().toLowerCase();
  const matchesSearch = (id: string): boolean => {
    if (!searchLc) return true;
    const a = applicationsById[id];
    if (!a) return false;
    const hay = [
      a.childFirstName,
      a.childLastName,
      a.family.name ?? "",
      ...a.family.contactNames,
      a.family.primaryEmail ?? "",
      a.family.primaryPhone ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(searchLc);
  };

  const findColumnFor = (appId: string): string | null => {
    for (const col of Object.values(columns)) {
      if (col.appIds.includes(appId)) return col.id;
    }
    return null;
  };

  const isStageId = (id: string) => stageOrder.some((s) => s.id === id);

  const onDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    if (isStageId(id)) {
      setActiveStageId(id);
      setActiveApp(null);
      return;
    }
    setActiveStageId(null);
    setActiveApp(applicationsById[id] ?? null);
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    const activeId = String(active.id);
    const overId = over ? String(over.id) : null;

    // ----- Stage reorder -----
    if (activeStageId) {
      setActiveStageId(null);
      if (!canManageStages || !overId || !isStageId(overId)) return;
      if (activeId === overId) return;
      const fromIdx = stageOrder.findIndex((s) => s.id === activeId);
      const toIdx = stageOrder.findIndex((s) => s.id === overId);
      if (fromIdx < 0 || toIdx < 0) return;
      const next = [...stageOrder];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      const prev = stageOrder;
      setStageOrder(next);
      startTransition(async () => {
        const res = await reorderAdmissionStagesAction(next.map((s) => s.id));
        if (!res.success) {
          setStageOrder(prev);
          toast.error(t("stageReorderError"), { description: res.error });
        }
      });
      return;
    }

    setActiveApp(null);
    if (!canMove) return;
    if (!over) return;

    const appId = activeId;
    // The droppable area of a column registers itself with id `drop:<stageId>`
    // to avoid colliding with the stage's sortable id. Strip the prefix here.
    let toColId = (overId ?? "").startsWith("drop:")
      ? (overId ?? "").slice("drop:".length)
      : overId ?? "";
    if (!columns[toColId]) {
      const owner = findColumnFor(toColId);
      if (!owner) return;
      toColId = owner;
    }
    const fromColId = findColumnFor(appId);
    if (!fromColId) return;
    if (fromColId === toColId) return;

    // optimistic
    setColumns((prev) => {
      const next = { ...prev };
      next[fromColId] = {
        ...prev[fromColId],
        appIds: prev[fromColId].appIds.filter((id) => id !== appId),
      };
      next[toColId] = {
        ...prev[toColId],
        appIds: [...prev[toColId].appIds, appId],
      };
      return next;
    });
    setApplicationsById((prev) => ({
      ...prev,
      [appId]: { ...prev[appId], admissionStageId: toColId },
    }));

    startTransition(async () => {
      const res = await moveApplicationAction({
        id: appId,
        toStageId: toColId,
      });
      if (!res.success) {
        // rollback
        setColumns((prev) => {
          const next = { ...prev };
          next[toColId] = {
            ...prev[toColId],
            appIds: prev[toColId].appIds.filter((id) => id !== appId),
          };
          next[fromColId] = {
            ...prev[fromColId],
            appIds: [...prev[fromColId].appIds, appId],
          };
          return next;
        });
        setApplicationsById((prev) => ({
          ...prev,
          [appId]: { ...prev[appId], admissionStageId: fromColId },
        }));
        toast.error(t("moveError"), { description: res.error });
      } else {
        toast.success(t("moveOk"));
      }
    });
  };

  const totalCount = useMemo(
    () => Object.values(columns).reduce((sum, c) => sum + c.appIds.length, 0),
    [columns],
  );

  const overdueRemindersTotal = useMemo(
    () =>
      Object.values(applicationsById).reduce(
        (sum, a) => sum + (a.overdueRemindersCount ?? 0),
        0,
      ),
    [applicationsById],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 max-w-sm"
        />
        <Badge variant="secondary" className="gap-1">
          <Users2 className="h-3 w-3" />
          {t("totalApplications", { count: totalCount })}
        </Badge>
        <div className="ml-auto flex gap-2">
          <div
            className="flex items-center rounded-md border bg-card p-0.5"
            role="tablist"
            aria-label={t("viewToggle")}
          >
            <Button
              size="sm"
              variant={view === "board" ? "secondary" : "ghost"}
              className="h-7 gap-1 px-2"
              onClick={() => setView("board")}
              aria-pressed={view === "board"}
              title={t("viewBoard")}
            >
              <Kanban className="h-4 w-4" />
              <span className="hidden sm:inline">{t("viewBoard")}</span>
            </Button>
            <Button
              size="sm"
              variant={view === "list" ? "secondary" : "ghost"}
              className="h-7 gap-1 px-2"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              title={t("viewList")}
            >
              <LayoutList className="h-4 w-4" />
              <span className="hidden sm:inline">{t("viewList")}</span>
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              router.push(`/admin/admissions/reminders`)
            }
            className="relative"
          >
            <Bell className="mr-1 h-4 w-4" />
            {t("remindersNavLabel")}
            {overdueRemindersTotal > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
                {overdueRemindersTotal}
              </span>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/admin/admissions/email-templates`)}
          >
            <Mail className="mr-1 h-4 w-4" />
            {t("emailTemplatesNavLabel")}
          </Button>
          {canManageStages && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowStages(true)}
            >
              <Layers className="mr-1 h-4 w-4" />
              {t("manageStages")}
            </Button>
          )}
          {canCreate && (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="mr-1 h-4 w-4" />
              {t("newApplication")}
            </Button>
          )}
        </div>
      </div>

      {!mounted ? (
        <div className="flex gap-3 overflow-x-auto">
          {initialStages.map((stage) => (
            <div
              key={stage.id}
              className="h-[300px] w-[280px] shrink-0 animate-pulse rounded-lg border bg-muted/30"
            />
          ))}
        </div>
      ) : view === "list" ? (
        <AdmissionsList
          stages={stageOrder}
          applications={Object.values(applicationsById).filter((a) =>
            matchesSearch(a.id),
          )}
          onOpenCard={openApplication}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={stageOrder.map((s) => s.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-3 overflow-x-auto pb-2">
              {stageOrder.map((stage) => {
                const ids = columns[stage.id]?.appIds ?? [];
                const visibleApps = ids
                  .filter(matchesSearch)
                  .map((id) => applicationsById[id])
                  .filter(Boolean);
                const collapsed = collapsedStages.has(stage.id);
                return (
                  <KanbanColumn
                    key={stage.id}
                    stage={stage}
                    count={ids.length}
                    applications={visibleApps}
                    onOpenCard={openApplication}
                    canDrag={canMove}
                    canReorderStages={canManageStages}
                    collapsed={collapsed}
                    onToggleCollapsed={() => toggleCollapsed(stage.id)}
                  />
                );
              })}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeApp ? (
              <AdmissionCardVisual
                application={activeApp}
                dragging
                className="rotate-1"
              />
            ) : activeStageId ? (
              <div className="h-12 w-[280px] rounded-md border bg-card px-3 py-2 text-sm font-semibold shadow-lg">
                {stageOrder.find((s) => s.id === activeStageId)?.name}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {showCreate && (
        <CreateApplicationDialog
          stages={initialStages}
          existingFamilies={Object.values(applicationsById).map((a) => ({
            id: a.familyId,
            name: a.family.name ?? `${a.childLastName}`,
            contactNames: a.family.contactNames,
          }))}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
          }}
        />
      )}

      {showStages && canManageStages && (
        <ManageStagesDialog
          stages={initialStages}
          onClose={() => setShowStages(false)}
        />
      )}
    </div>
  );
}

interface ColumnProps {
  stage: KanbanStage;
  count: number;
  applications: KanbanApplication[];
  onOpenCard: (id: string) => void;
  canDrag: boolean;
  canReorderStages: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

function KanbanColumn({
  stage,
  count,
  applications,
  onOpenCard,
  canDrag,
  canReorderStages,
  collapsed,
  onToggleCollapsed,
}: ColumnProps) {
  const t = useTranslations("Admissions");
  // Drop-zone for Cards being dragged into this stage. Uses a prefixed id so
  // it doesn't collide with the stage's own sortable id (which is `stage.id`
  // and handles the column-reorder gesture).
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop:${stage.id}`,
  });

  // Make the column itself a sortable item so admins can reorder stages by
  // dragging the header handle. The same `stage.id` works as the active drag
  // target — `onDragEnd` differentiates app-drags from stage-drags.
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id, disabled: !canReorderStages });
  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Client-only average days-in-stage; same hydration rationale as the
  // per-card daysInStage badge.
  const [avgDays, setAvgDays] = useState<number | null>(null);
  useEffect(() => {
    if (applications.length === 0) {
      setAvgDays(null);
      return;
    }
    const now = Date.now();
    const total = applications.reduce(
      (sum, a) =>
        sum +
        Math.max(
          0,
          Math.floor(
            (now - new Date(a.stageEnteredAt).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        ),
      0,
    );
    setAvgDays(Math.round(total / applications.length));
  }, [applications]);

  // Collapsed column: render a narrow vertical strip and stop here.
  if (collapsed) {
    return (
      <div
        ref={setSortableRef}
        style={sortableStyle}
        className={cn(
          "relative flex h-[300px] w-10 shrink-0 cursor-pointer flex-col items-center justify-between gap-1 rounded-md border bg-card py-2 transition hover:shadow-md",
          isOver && "ring-2 ring-primary",
          isDragging && "opacity-40",
        )}
        onClick={onToggleCollapsed}
        title={t("expandStage")}
      >
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1 rounded-t-md"
          style={{ backgroundColor: stage.color ?? "var(--muted)" }}
        />
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <span
          className="flex-1 text-xs font-semibold"
          style={{ writingMode: "vertical-rl" }}
        >
          {stage.name}
        </span>
        <Badge variant="secondary" className="text-[10px]">
          {count}
        </Badge>
      </div>
    );
  }

  return (
    <Card
      ref={setSortableRef}
      style={sortableStyle}
      className={cn(
        "relative flex w-[300px] shrink-0 flex-col gap-0 overflow-hidden",
        isOver && "ring-2 ring-primary",
        stage.stageType === "REJECTED" && "opacity-95",
        isDragging && "opacity-50",
      )}
    >
      {/* Stage colour top-strip */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: stage.color ?? "var(--muted)" }}
      />
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1">
            {canReorderStages && (
              <button
                type="button"
                {...attributes}
                {...listeners}
                className="shrink-0 cursor-grab rounded text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
                aria-label={t("dragStage")}
                title={t("dragStage")}
              >
                <GripVertical className="h-4 w-4" />
              </button>
            )}
            <CardTitle className="min-w-0 truncate text-sm font-semibold">
              {stage.name}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1.5">
            {avgDays !== null && avgDays > 0 && (
              <span
                className="text-[10px] text-muted-foreground"
                title={t("avgDaysInStage", { count: avgDays })}
              >
                ⌀ {avgDays}d
              </span>
            )}
            <Badge variant="secondary" className="text-[10px]">
              {count}
            </Badge>
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="rounded text-muted-foreground/60 hover:text-foreground"
              aria-label={t("collapseStage")}
              title={t("collapseStage")}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent
        ref={setDropRef}
        className={cn(
          "flex flex-col gap-1.5 p-3 pt-1",
          COLUMN_MIN_HEIGHT,
          isOver && "rounded-md bg-accent/50",
        )}
      >
        <SortableContext
          items={applications.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          {applications.length === 0 ? (
            <p className="mt-2 text-xs italic text-muted-foreground">—</p>
          ) : (
            applications.map((a) => (
              <DraggableApplication
                key={a.id}
                application={a}
                stageColor={stage.color}
                onOpen={onOpenCard}
                canDrag={canDrag}
              />
            ))
          )}
        </SortableContext>
      </CardContent>
    </Card>
  );
}

function DraggableApplication({
  application,
  stageColor,
  onOpen,
  canDrag,
}: {
  application: KanbanApplication;
  stageColor: string | null;
  onOpen: (id: string) => void;
  canDrag: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: application.id, disabled: !canDrag });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(canDrag ? attributes : {})}
      {...(canDrag ? listeners : {})}
      className={cn(isDragging && "opacity-30")}
    >
      <AdmissionCardVisual
        application={application}
        stageColor={stageColor}
        onOpen={onOpen}
      />
    </div>
  );
}
