import { ProgressOverviewPage } from "@/features/record-keeping/components/ProgressOverviewPage";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ classId?: string; view?: string }>;
}

const RecordKeepingOverviewPage = async ({ params, searchParams }: PageProps) => {
  const { locale } = await params;
  const { classId, view } = await searchParams;

  return (
    <ProgressOverviewPage
      locale={locale}
      classId={classId}
      view={view}
    />
  );
};

export default RecordKeepingOverviewPage;
