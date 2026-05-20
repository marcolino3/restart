"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { getClassroomAttentionAction } from "../actions/get-classroom-attention.action";
import { getClassroomHeatmapAction } from "../actions/get-classroom-heatmap.action";
import type { HeatmapData } from "../actions/get-classroom-heatmap.action";
import type { StudentAttentionSummary } from "../actions/get-classroom-attention.action";
import { ClassroomEngagementTimelineChart } from "./ClassroomEngagementTimelineChart";
import { ClassroomHeatmap } from "./ClassroomHeatmap";
import { StudentAttentionList } from "./StudentAttentionList";

interface Props {
  schoolClassId: string;
  locale: string;
  /** Eager-loaded data for the initial tab — null for the other tab,
   *  which the client fetches on first activation. */
  initialHeatmap: HeatmapData | null;
  initialAttention: StudentAttentionSummary[] | null;
  initialTab: string;
}

/** Tab keys are stable URL params — don't rename without backwards-compat. */
const TAB_ATTENTION = "attention";
const TAB_HEATMAP = "heatmap";
const TAB_ENGAGEMENT = "engagement";
const KNOWN_TABS = new Set([TAB_ATTENTION, TAB_HEATMAP, TAB_ENGAGEMENT]);

export function ClassroomTabs({
  schoolClassId,
  locale,
  initialHeatmap,
  initialAttention,
  initialTab,
}: Props) {
  const t = useTranslations("RecordKeeping");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = KNOWN_TABS.has(initialTab) ? initialTab : TAB_ATTENTION;

  const [heatmap, setHeatmap] = useState<HeatmapData | null>(initialHeatmap);
  const [attention, setAttention] = useState<StudentAttentionSummary[] | null>(
    initialAttention,
  );
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);
  const [loadingAttention, setLoadingAttention] = useState(false);
  // Once-per-mount fetch guard so React StrictMode double-mount doesn't
  // fire the action twice in dev.
  const heatmapFetched = useRef(initialHeatmap !== null);
  const attentionFetched = useRef(initialAttention !== null);

  const ensureAttention = useCallback(() => {
    if (attentionFetched.current) return;
    attentionFetched.current = true;
    setLoadingAttention(true);
    getClassroomAttentionAction(schoolClassId)
      .then((res) => {
        if (res.success) setAttention(res.data);
      })
      .finally(() => setLoadingAttention(false));
  }, [schoolClassId]);

  const ensureHeatmap = useCallback(() => {
    if (heatmapFetched.current) return;
    heatmapFetched.current = true;
    setLoadingHeatmap(true);
    getClassroomHeatmapAction(schoolClassId, locale)
      .then((res) => {
        if (res.success) setHeatmap(res.data);
      })
      .finally(() => setLoadingHeatmap(false));
  }, [schoolClassId, locale]);

  // Trigger the active tab's loader on mount (handles deep-links to a
  // tab whose data the server didn't pre-load).
  useEffect(() => {
    if (activeTab === TAB_ATTENTION) ensureAttention();
    if (activeTab === TAB_HEATMAP) ensureHeatmap();
  }, [activeTab, ensureAttention, ensureHeatmap]);

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", value);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      if (value === TAB_ATTENTION) ensureAttention();
      if (value === TAB_HEATMAP) ensureHeatmap();
    },
    [pathname, router, searchParams, ensureAttention, ensureHeatmap],
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="w-full"
    >
      <TabsList className="mb-6">
        <TabsTrigger
          value={TAB_ATTENTION}
          onMouseEnter={ensureAttention}
          onFocus={ensureAttention}
        >
          {t("subtabAttention")}
          {attention && attention.length > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-800 tabular-nums">
              {attention.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger
          value={TAB_HEATMAP}
          onMouseEnter={ensureHeatmap}
          onFocus={ensureHeatmap}
        >
          {t("subtabHeatmap")}
        </TabsTrigger>
        <TabsTrigger value={TAB_ENGAGEMENT}>
          {t("subtabEngagementTimeline")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value={TAB_ATTENTION}>
        {loadingAttention && attention === null ? (
          <TabSkeleton />
        ) : attention === null || attention.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            {t("attentionNoData")}
          </p>
        ) : (
          <StudentAttentionList summaries={attention} />
        )}
      </TabsContent>

      <TabsContent value={TAB_HEATMAP}>
        {loadingHeatmap && heatmap === null ? (
          <TabSkeleton />
        ) : heatmap === null ? (
          <p className="text-sm text-muted-foreground">—</p>
        ) : (
          <ClassroomHeatmap data={heatmap} />
        )}
      </TabsContent>

      <TabsContent value={TAB_ENGAGEMENT}>
        <ClassroomEngagementTimelineChart schoolClassId={schoolClassId} />
      </TabsContent>
    </Tabs>
  );
}

function TabSkeleton() {
  return (
    <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Lade…
    </div>
  );
}
