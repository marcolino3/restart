import { endOfWeek } from "date-fns";
import { getTranslations } from "next-intl/server";

import { getMyTasksAction } from "@/features/projects/actions/get-my-tasks.action";
import { getProjectsAction } from "@/features/projects/actions/get-projects.action";
import { MyTasksTable } from "@/features/projects/components/MyTasksTable";

const MyTasksPage = async () => {
  const t = await getTranslations("Projects");
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
      <div>
        <h1 className="text-2xl font-bold">{t("myTasksTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("myTasksSummary", { open: openTasks.length, dueThisWeek })}
        </p>
      </div>
      <MyTasksTable tasks={result.data} projects={projects} />
    </div>
  );
};

export default MyTasksPage;
