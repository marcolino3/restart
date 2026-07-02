import { getTranslations } from "next-intl/server";

import { getMyTasksAction } from "@/features/projects/actions/get-my-tasks.action";
import { MyTasksTable } from "@/features/projects/components/MyTasksTable";

const MyTasksPage = async () => {
  const t = await getTranslations("Projects");
  const result = await getMyTasksAction();

  if (!result.success) {
    return <div className="p-4 text-sm text-destructive">{t("loadError")}</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">{t("myTasksTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("myTasksSubtitle")}</p>
      </div>
      <MyTasksTable tasks={result.data} />
    </div>
  );
};

export default MyTasksPage;
