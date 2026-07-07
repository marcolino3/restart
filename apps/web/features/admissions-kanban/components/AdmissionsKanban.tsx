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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUpDown,
  Ban,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Inbox,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { moveApplicationAction } from "../actions/move-application.action";
import type {
  AdmissionRejectionReason,
  AdmissionSource,
  KanbanApplication,
  KanbanStage,
} from "../types";
import { AdmissionCardVisual } from "./AdmissionCard";
import { AdmissionsList } from "./AdmissionsList";
import {
  CreateApplicationDialog,
  type GradeLevelOption,
} from "./CreateApplicationDialog";
import { ManageRejectionReasonsDialog } from "./ManageRejectionReasonsDialog";
import { ManageSourcesDialog } from "./ManageSourcesDialog";
import { ManageAppointmentTypesDialog } from "./ManageAppointmentTypesDialog";
import { ManageStagesDialog } from "./ManageStagesDialog";

const COLLAPSED_KEY = "admissions-kanban:collapsed-stages";
const VIEW_KEY = "admissions-kanban:view";
const STAGE_SORT_KEY = "admissions-kanban:stage-sorts";

/** Fields a column's cards can be sorted by. `manual` ⇒ backend position. */
type StageSortField =
  | "manual"
  | "name"
  | "birthYear"
  | "gender"
  | "gradeLevel"
  | "family"
  | "source"
  | "status"
  | "daysInStage"
  | "reminders";

type StageSort = { field: StageSortField; dir: "asc" | "desc" };

/** i18n label key per sort field (reuses existing `field*` keys where possible). */
const STAGE_SORT_LABEL: Record<StageSortField, string> = {
  manual: "sortManual",
  name: "fieldChildName",
  birthYear: "fieldBirthYear",
  gender: "fieldGender",
  gradeLevel: "fieldGradeLevel",
  family: "fieldFamilyName",
  source: "fieldSource",
  status: "fieldStatus",
  daysInStage: "fieldDaysInStage",
  reminders: "fieldReminders",
};

const STAGE_SORT_FIELDS = Object.keys(STAGE_SORT_LABEL) as StageSortField[];

/** Comparable value for a card under a given sort field. */
const stageSortValue = (
  field: StageSortField,
  a: KanbanApplication,
): string | number => {
  switch (field) {
    case "name":
      return `${a.childLastName} ${a.childFirstName}`.toLowerCase();
    case "birthYear":
      return a.childDateOfBirth ?? "9999";
    case "gender":
      return a.childGender ?? "ZZZ";
    case "gradeLevel":
      return a.assignedGradeLevelName ?? "ZZZ";
    case "family":
      return (a.family.name ?? "ZZZ").toLowerCase();
    case "source":
      return a.admissionSource?.name ?? "ZZZ";
    case "status":
      return a.status;
    case "daysInStage":
      // Older `stageEnteredAt` ⇒ more days; sort by the raw timestamp.
      return new Date(a.stageEnteredAt).getTime();
    case "reminders":
      return a.openRemindersCount;
    default:
      return 0;
  }
};

/** Sort a column's applications in place per the selected sort (manual = identity). */
const sortApplications = (
  apps: KanbanApplication[],
  sort: StageSort | undefined,
): KanbanApplication[] => {
  if (!sort || sort.field === "manual") return apps;
  const dir = sort.dir === "asc" ? 1 : -1;
  return [...apps].sort((a, b) => {
    const va = stageSortValue(sort.field, a);
    const vb = stageSortValue(sort.field, b);
    if (typeof va === "number" && typeof vb === "number") {
      return dir * (va - vb);
    }
    return dir * String(va).localeCompare(String(vb));
  });
};

interface Props {
  initialStages: KanbanStage[];
  initialApplications: KanbanApplication[];
  /** Org-global table column selection; `null` ⇒ default set. */
  initialTableColumns: string[] | null;
  initialRejectionReasons: AdmissionRejectionReason[];
  /** Org intake channels — power the source select + "verwalten" dialog. */
  initialSources: AdmissionSource[];
  /** Grade levels for the "desired grade" select in the create sheet. */
  gradeLevels: GradeLevelOption[];
  canCreate: boolean;
  canMove: boolean;
  canEnroll: boolean;
  canWrite: boolean;
  canManageStages: boolean;
  /** Number of rejected applications — shown as a count on the "Absagen" chip. */
  rejectedCount: number;
}

type ColumnState = {
  id: string;
  appIds: string[];
};

const COLUMN_MIN_HEIGHT = "min-h-[300px]";

export function AdmissionsKanban({
  initialStages,
  initialApplications,
  initialTableColumns,
  initialRejectionReasons,
  initialSources,
  gradeLevels,
  canCreate,
  canMove,
  canManageStages,
  rejectedCount,
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
  const [showCreate, setShowCreate] = useState(false);
  // Stage preselected when the create dialog is opened via a column's
  // "+ Hinzufügen" button; null for the global "Neue Bewerbung" button.
  const [createStageId, setCreateStageId] = useState<string | null>(null);
  const [showStages, setShowStages] = useState(false);
  const [showReasons, setShowReasons] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [manageTypesOpen, setManageTypesOpen] = useState(false);

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
  // Per-stage card sort preference (field + direction); persisted in
  // localStorage. Absent entry ⇒ manual (backend `position`) order.
  const [stageSorts, setStageSorts] = useState<Record<string, StageSort>>(
    () => ({}),
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
      const s = window.localStorage.getItem(STAGE_SORT_KEY);
      if (s) {
        try {
          const obj = JSON.parse(s) as Record<string, StageSort>;
          if (obj && typeof obj === "object") setStageSorts(obj);
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
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STAGE_SORT_KEY, JSON.stringify(stageSorts));
  }, [stageSorts]);

  const setStageSort = (stageId: string, sort: StageSort) =>
    setStageSorts((prev) => {
      // Drop the entry entirely when reset to manual to keep storage tidy.
      if (sort.field === "manual") {
        const { [stageId]: _omit, ...rest } = prev;
        return rest;
      }
      return { ...prev, [stageId]: sort };
    });

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

  const onDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    // Only Cards are draggable; stage columns are fixed.
    setActiveApp(applicationsById[id] ?? null);
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    const activeId = String(active.id);
    const overId = over ? String(over.id) : null;

    setActiveApp(null);
    if (!canMove) return;
    if (!over) return;

    const appId = activeId;
    // The droppable area of a column registers itself with id `drop:<stageId>`
    // to avoid colliding with the stage's sortable id. Strip the prefix here.
    let toColId = (overId ?? "").startsWith("drop:")
      ? (overId ?? "").slice("drop:".length)
      : (overId ?? "");
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

  const openRemindersTotal = useMemo(
    () =>
      Object.values(applicationsById).reduce(
        (sum, a) => sum + (a.openRemindersCount ?? 0),
        0,
      ),
    [applicationsById],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Row 1 — title + combined meta · "Neue Bewerbung" on the right. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="text-[26px] font-bold leading-none tracking-[-0.025em]">
          {t("pageTitle")}
        </h2>
        <span className="text-[13.5px] text-muted-foreground">
          {t("activeApplicationsCount", { count: totalCount })}
          {openRemindersTotal > 0 && (
            <>
              {" · "}
              {t("remindersTodayCount", { count: openRemindersTotal })}
            </>
          )}
        </span>
        {canCreate && (
          <Button
            className="ml-auto gap-1.5"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={16} />
            {t("newApplication")}
          </Button>
        )}
      </div>

      {/* Row 2 — search + view tabs (left) · nav chips + more menu (right). */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-[280px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 rounded-full pl-8"
          />
        </div>

        {/* Board / list segmented control (saas-konzept .seg). */}
        <div
          className="inline-flex items-center gap-0.5 rounded-full border bg-card p-[3px]"
          role="tablist"
          aria-label={t("viewToggle")}
        >
          {(["board", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cn(
                "rounded-full px-3.5 py-[5px] text-[12.5px] font-[600] transition-colors",
                view === v
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v === "board" ? t("viewBoard") : t("viewList")}
            </button>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/* Navigation chips — reminders · rejected (with counts). */}
          <button
            type="button"
            onClick={() => router.push("/admin/admissions/reminders")}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border bg-card px-4 text-[13px] font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          >
            {t("remindersNavLabel")}
            {openRemindersTotal > 0 && (
              <span className="tabular-nums text-muted-foreground/70">
                · {openRemindersTotal}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/admissions/rejected")}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border bg-card px-4 text-[13px] font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          >
            {t("subNavRejected")}
            {rejectedCount > 0 && (
              <span className="tabular-nums text-muted-foreground/70">
                · {rejectedCount}
              </span>
            )}
          </button>

          {canManageStages && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 rounded-full"
                  aria-label={t("moreSettings")}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setShowStages(true)}>
                  <Columns3 className="mr-2 h-4 w-4" />
                  {t("manageStages")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowReasons(true)}>
                  <Ban className="mr-2 h-4 w-4" />
                  {t("manageRejectionReasons")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowSources(true)}>
                  <Inbox className="mr-2 h-4 w-4" />
                  {t("manageSources")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setManageTypesOpen(true)}>
                  <CalendarClock className="mr-2 h-4 w-4" />
                  {t("manageAppointmentTypes")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    router.push("/admin/admissions/email-templates")
                  }
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {t("manageEmailTemplates")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {!mounted ? (
        <div className="flex gap-3 overflow-x-auto">
          {initialStages.map((stage) => (
            <div
              key={stage.id}
              className="h-[300px] w-60 shrink-0 animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      ) : view === "list" ? (
        <AdmissionsList
          stages={stageOrder}
          tableColumns={initialTableColumns}
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
          <div className="flex gap-3 overflow-x-auto pb-2">
            {stageOrder.map((stage) => {
                const ids = columns[stage.id]?.appIds ?? [];
                const sort = stageSorts[stage.id];
                const visibleApps = sortApplications(
                  ids
                    .filter(matchesSearch)
                    .map((id) => applicationsById[id])
                    .filter(Boolean),
                  sort,
                );
                const collapsed = collapsedStages.has(stage.id);
                return (
                  <KanbanColumn
                    key={stage.id}
                    stage={stage}
                    count={ids.length}
                    applications={visibleApps}
                    onOpenCard={openApplication}
                    canDrag={canMove}
                    collapsed={collapsed}
                    onToggleCollapsed={() => toggleCollapsed(stage.id)}
                    sort={sort}
                    onChangeSort={(next) => setStageSort(stage.id, next)}
                    canAdd={canManageStages || canMove}
                    onAddCard={() => {
                      setCreateStageId(stage.id);
                      setShowCreate(true);
                    }}
                  />
                );
              })}
          </div>

          <DragOverlay>
            {activeApp ? (
              <AdmissionCardVisual
                application={activeApp}
                cardFields={
                  stageOrder.find((s) => s.id === activeApp.admissionStageId)
                    ?.cardFields ?? null
                }
                dragging
                className="rotate-1"
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {showCreate && (
        <CreateApplicationDialog
          stages={initialStages}
          gradeLevels={gradeLevels}
          sources={initialSources}
          initialStageId={createStageId}
          existingFamilies={Object.values(applicationsById).map((a) => ({
            id: a.familyId,
            name: a.family.name ?? `${a.childLastName}`,
            contactNames: a.family.contactNames,
          }))}
          onClose={() => {
            setShowCreate(false);
            setCreateStageId(null);
          }}
          onCreated={() => {
            setShowCreate(false);
            setCreateStageId(null);
          }}
        />
      )}

      {showStages && canManageStages && (
        <ManageStagesDialog
          stages={initialStages}
          tableColumns={initialTableColumns}
          onClose={() => setShowStages(false)}
        />
      )}

      {showReasons && canManageStages && (
        <ManageRejectionReasonsDialog
          reasons={initialRejectionReasons}
          onClose={() => setShowReasons(false)}
        />
      )}

      {showSources && canManageStages && (
        <ManageSourcesDialog
          sources={initialSources}
          onClose={() => setShowSources(false)}
        />
      )}

      {manageTypesOpen && canManageStages && (
        <ManageAppointmentTypesDialog
          types={[]}
          onClose={() => setManageTypesOpen(false)}
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
  collapsed: boolean;
  onToggleCollapsed: () => void;
  sort: StageSort | undefined;
  onChangeSort: (sort: StageSort) => void;
  canAdd: boolean;
  onAddCard: () => void;
}

function KanbanColumn({
  stage,
  count,
  applications,
  onOpenCard,
  canDrag,
  collapsed,
  onToggleCollapsed,
  sort,
  onChangeSort,
  canAdd,
  onAddCard,
}: ColumnProps) {
  const t = useTranslations("Admissions");
  // Drop-zone for Cards being dragged into this stage. Uses a prefixed id so
  // it doesn't collide with the stage's own sortable id (which is `stage.id`
  // and handles the column-reorder gesture).
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop:${stage.id}`,
  });

  // Stage columns are intentionally NOT draggable — only Cards move between
  // stages. (Stage order is managed via the "Stages verwalten" dialog.)

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
        className={cn(
          "flex h-[300px] w-10 shrink-0 cursor-pointer flex-col items-center justify-between gap-2 rounded-lg bg-muted py-2 transition hover:bg-muted/80",
          isOver && "ring-2 ring-primary",
        )}
        onClick={onToggleCollapsed}
        title={t("expandStage")}
      >
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <span
          aria-hidden
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: stage.color ?? "var(--muted-foreground)" }}
        />
        <span
          className="flex-1 text-xs font-[600]"
          style={{ writingMode: "vertical-rl" }}
        >
          {stage.name}
        </span>
        <Badge
          variant="secondary"
          className="font-mono text-[10px] tabular-nums"
        >
          {count}
        </Badge>
      </div>
    );
  }

  return (
    <div
      className={cn(
        // .kan-col: bg = color-mix(panel 55%, bg), 1px border, radius-card,
        // p-3, gap-[9px]. A 3px stage-colour bar sits on top via ::before —
        // here rendered as a rounded child element.
        "relative flex w-60 shrink-0 flex-col gap-[9px] overflow-hidden rounded-card border p-3",
        isOver && "ring-2 ring-primary",
        stage.stageType === "REJECTED" && "opacity-95",
      )}
      style={{
        background: "color-mix(in oklab, var(--card) 55%, var(--background))",
      }}
    >
      {/* .kan-col::before — 3px stage-colour bar across the top. */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: stage.color ?? "var(--muted-foreground)" }}
      />
      {/* Column head (.ch) — colour dot · name · avg · count · controls. */}
      <div className="flex items-center gap-2 px-1.5 pb-1.5 pt-1 text-[13.5px] font-[650]">
        <span
          aria-hidden
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: stage.color ?? "var(--muted-foreground)" }}
        />
        <span className="min-w-0 flex-1 truncate">{stage.name}</span>
        {avgDays !== null && avgDays > 0 && (
          <span
            className="shrink-0 whitespace-nowrap font-mono text-[10.5px] font-normal tabular-nums text-muted-foreground"
            title={t("avgDaysInStage", { count: avgDays })}
          >
            ⌀ {avgDays}d
          </span>
        )}
        <span className="shrink-0 font-mono text-[11px] font-[600] tabular-nums text-muted-foreground">
          {count}
        </span>
        <StageSortMenu sort={sort} onChangeSort={onChangeSort} />
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
      <div
        ref={setDropRef}
        className={cn(
          // `grid-cols-1` pins the track width to the column so a long meta
          // line / nowrap pill can't blow the card wider than its container.
          "grid grid-cols-1 content-start gap-[9px]",
          COLUMN_MIN_HEIGHT,
          isOver && "rounded-md bg-accent/40",
        )}
      >
        <SortableContext
          items={applications.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          {applications.length === 0 ? (
            <p className="mt-1 px-1.5 text-xs italic text-muted-foreground">
              —
            </p>
          ) : (
            applications.map((a) => (
              <DraggableApplication
                key={a.id}
                application={a}
                cardFields={stage.cardFields}
                onOpen={onOpenCard}
                canDrag={canDrag}
              />
            ))
          )}
        </SortableContext>
        {canAdd && stage.stageType !== "REJECTED" && (
          <button
            type="button"
            onClick={onAddCard}
            className="flex items-center justify-center gap-1.5 rounded-[calc(var(--radius-card)-4px)] border-[1.5px] border-dashed border-border p-2 text-center text-[12.5px] font-[550] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <Plus size={14} />
            {t("addApplicationToStage")}
          </button>
        )}
      </div>
    </div>
  );
}

function StageSortMenu({
  sort,
  onChangeSort,
}: {
  sort: StageSort | undefined;
  onChangeSort: (sort: StageSort) => void;
}) {
  const t = useTranslations("Admissions");
  const active = sort && sort.field !== "manual";
  const dir = sort?.dir ?? "asc";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "rounded text-muted-foreground/60 hover:text-foreground",
            active && "text-primary",
          )}
          aria-label={t("sortBy")}
          title={t("sortBy")}
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t("sortBy")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={sort?.field ?? "manual"}
          onValueChange={(v) =>
            onChangeSort({ field: v as StageSortField, dir })
          }
        >
          {STAGE_SORT_FIELDS.map((field) => (
            <DropdownMenuRadioItem key={field} value={field}>
              {t(STAGE_SORT_LABEL[field])}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {active && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={dir}
              onValueChange={(v) =>
                onChangeSort({
                  field: sort?.field ?? "manual",
                  dir: v as "asc" | "desc",
                })
              }
            >
              <DropdownMenuRadioItem value="asc">
                <ArrowUpAZ className="mr-2 h-3.5 w-3.5" />
                {t("sortAscending")}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="desc">
                <ArrowDownAZ className="mr-2 h-3.5 w-3.5" />
                {t("sortDescending")}
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DraggableApplication({
  application,
  cardFields,
  onOpen,
  canDrag,
}: {
  application: KanbanApplication;
  cardFields: string[] | null;
  onOpen: (id: string) => void;
  canDrag: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: application.id, disabled: !canDrag });
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
        cardFields={cardFields}
        onOpen={onOpen}
      />
    </div>
  );
}
