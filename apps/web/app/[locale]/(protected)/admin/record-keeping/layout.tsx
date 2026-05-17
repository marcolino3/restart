import { getMyTeachingSchoolClassesAction } from "@/features/school-classes/actions/get-my-teaching-school-classes.action";
import { RecordKeepingClassPicker } from "@/features/record-keeping/components/RecordKeepingClassPicker";
import { RecordKeepingTopNav } from "@/features/record-keeping/components/RecordKeepingTopNav";

export default async function RecordKeepingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const classesRes = await getMyTeachingSchoolClassesAction();
  const classes = classesRes.success
    ? classesRes.data
        .filter((c) => c.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
        .map((c) => ({ id: c.id, name: c.name }))
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-3">
        <RecordKeepingClassPicker classes={classes} />
        <RecordKeepingTopNav />
      </div>
      {children}
    </div>
  );
}
