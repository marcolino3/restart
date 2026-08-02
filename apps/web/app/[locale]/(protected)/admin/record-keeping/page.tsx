import { ProgressOverviewPage } from "@/features/record-keeping/components/ProgressOverviewPage";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ classId?: string; subtab?: string; view?: string }>;
}

const RecordKeepingOverviewPage = async ({ params, searchParams }: PageProps) => {
  const { locale } = await params;
  const { classId, subtab, view } = await searchParams;

  return (
    <ProgressOverviewPage
      locale={locale}
      classId={classId}
      subtab={subtab}
      view={view}
    />
  );
};

export default RecordKeepingOverviewPage;
