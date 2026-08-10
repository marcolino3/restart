import { endOfWeek } from "date-fns";
import { getTranslations } from "next-intl/server";

import { PageHead } from "@/components/common/PageHead";
import { getMyTasksAction } from "@/features/projects/actions/get-my-tasks.action";
import { getProjectsAction } from "@/features/projects/actions/get-projects.action";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { MyTasksTable } from "@/features/projects/components/MyTasksTable";
import { canSeeMyTasks } from "@/lib/navigation/nav-visibility";

const MyTasksPage = async () => {
  const t = await getTranslations("Projects");

  // Spiegel der Nav-Sichtbarkeit: ohne aktiviertes Org-Feature auch kein
  // Direktzugriff per URL.
  const userRes = await getCurrentUserAction();
  if (!canSeeMyTasks(userRes?.data)) {
    return <div className="p-4 text-sm text-destructive">{t("loadError")}</div>;
  }

  const [result, projectsResult] = await Promise.all([
    getMyTasksAction(),
    getProjectsAction(),
  ]);

  if (!result.success) {
    return <div className="p-4 text-sm text-destructive">{t("loadError")}</div>;
  }

  const projects = projectsResult.success
    ? projectsResult.data
        .filter((project) => !project.isArchived)
        .map(({ id, title }) => ({ id, title }))
    : [];

  const openTasks = result.data.filter((task) => task.status !== "DONE");
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const dueThisWeek = openTasks.filter(
    (task) => task.dueDate && new Date(task.dueDate) <= weekEnd,
  ).length;

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHead
        stacked
        title={t("myTasksTitle")}
        subtitle={t("myTasksSummary", { open: openTasks.length, dueThisWeek })}
      />
      <MyTasksTable tasks={result.data} projects={projects} />
    </div>
  );
};

export default MyTasksPage;
