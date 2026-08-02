import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROUTES } from "@/constants/routes";
import { getMyLessonRecordStatsAction } from "../actions/get-my-lesson-record-stats.action";
import { getRecentLessonRecordsAction } from "../actions/get-recent-lesson-records.action";
import { ProgressStatCards } from "./ProgressStatCards";
import { ProgressEntriesTable } from "./ProgressEntriesTable";
import { ClassroomOverviewTab } from "./ClassroomOverviewTab";

const ENTRIES_LIMIT = 50;

interface Props {
  locale: string;
  classId?: string;
  subtab?: string;
  view?: string;
}

const VIEW_MY_ENTRIES = "my-entries";
const VIEW_CLASSROOM = "classroom";

/** "Fortschritte" overview: stat cards + Meine Einträge / Klassenübersicht tabs. */
export async function ProgressOverviewPage({
  locale,
  classId,
  subtab,
  view,
}: Props) {
  const t = await getTranslations("RecordKeeping");

  const [statsRes, entriesRes] = await Promise.all([
    getMyLessonRecordStatsAction(),
    getRecentLessonRecordsAction(ENTRIES_LIMIT, locale),
  ]);

  const activeView = view === VIEW_CLASSROOM ? VIEW_CLASSROOM : VIEW_MY_ENTRIES;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("overviewTitle")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("overviewSubtitle")}
          </p>
        </div>
        <Button asChild>
          <Link href={ROUTES.admin.recordKeepingEntry(locale)}>
            {t("recordProgressButton")}
          </Link>
        </Button>
      </div>

      {statsRes.success ? (
        <ProgressStatCards stats={statsRes.data} />
      ) : (
        <p className="text-sm text-destructive">{statsRes.error}</p>
      )}

      <Tabs value={activeView} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value={VIEW_MY_ENTRIES} asChild>
            <Link
              href={`?view=${VIEW_MY_ENTRIES}`}
              replace
              scroll={false}
            >
              {t("tabMyEntries")}
            </Link>
          </TabsTrigger>
          <TabsTrigger value={VIEW_CLASSROOM} asChild>
            <Link
              href={`?view=${VIEW_CLASSROOM}`}
              replace
              scroll={false}
            >
              {t("tabClassroomOverview")}
            </Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={VIEW_MY_ENTRIES}>
          {entriesRes.success ? (
            <ProgressEntriesTable data={entriesRes.data} />
          ) : (
            <p className="text-sm text-destructive">{entriesRes.error}</p>
          )}
        </TabsContent>

        <TabsContent value={VIEW_CLASSROOM}>
          <ClassroomOverviewTab locale={locale} classId={classId} subtab={subtab} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
