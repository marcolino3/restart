import { getEmployeeByIdAction } from "@/features/employees/actions/get-employee-by-id.action";
import { getEmployeeNotesAction } from "@/features/employee-notes/actions/get-employee-notes.action";
import EmployeeForm from "@/features/employees/components/EmployeeForm";
import EmployeeNotesList from "@/features/employee-notes/components/EmployeeNotesList";
import CreateEmployeeNoteDialog from "@/features/employee-notes/components/CreateEmployeeNoteDialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ employeeId: string }>;
}

const EditEmployeePage = async ({ params }: Props) => {
  const { employeeId } = await params;
  const t = await getTranslations("Common");
  const tE = await getTranslations("Employees");
  const tN = await getTranslations("EmployeeNotes");

  const [employeeResult, notesResult] = await Promise.all([
    getEmployeeByIdAction(employeeId),
    getEmployeeNotesAction(employeeId),
  ]);

  if (!employeeResult.success || !employeeResult.data) {
    notFound();
  }

  const employee = employeeResult.data;
  const notes = notesResult.success ? notesResult.data : [];
  const employeeName = employee.membership?.user
    ? `${employee.membership.user.firstName} ${employee.membership.user.lastName}`
    : "";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        {tE("editEmployee")} {employeeName && `– ${employeeName}`}
      </h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">{t("personalData")}</TabsTrigger>
          <TabsTrigger value="notes">{tN("logbook")}</TabsTrigger>
          <TabsTrigger value="absences" disabled>
            {t("absenceNotice")}
          </TabsTrigger>
          <TabsTrigger value="contracts" disabled>
            {tE("contracts")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <EmployeeForm employee={employee} />
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{tN("logbook")}</CardTitle>
                <CreateEmployeeNoteDialog employeeId={employee.id} />
              </div>
            </CardHeader>
            <CardContent>
              <EmployeeNotesList notes={notes} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="absences">
          <Card>
            <CardHeader>
              <CardTitle>{t("absenceNotice")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {tE("comingSoon")}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts">
          <Card>
            <CardHeader>
              <CardTitle>{tE("contracts")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {tE("comingSoon")}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EditEmployeePage;
