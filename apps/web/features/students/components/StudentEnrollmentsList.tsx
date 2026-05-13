"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon, Plus, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { EnrollmentItem } from "../actions/get-student-enrollments.action";
import { createEnrollmentAction } from "../actions/create-enrollment.action";
import { updateEnrollmentAction } from "../actions/update-enrollment.action";
import { handleAction } from "@/lib/actions/handle-action";
import { SchoolClassListItem } from "@/features/school-classes/actions/get-school-classes.action";

interface Props {
  studentId: string;
  enrollments: EnrollmentItem[];
  schoolClasses: SchoolClassListItem[];
}

export function StudentEnrollmentsList({
  studentId,
  enrollments: initialEnrollments,
  schoolClasses,
}: Props) {
  const tS = useTranslations("Students");
  const tCommon = useTranslations("Common");
  const [enrollments, setEnrollments] =
    React.useState<EnrollmentItem[]>(initialEnrollments);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedClassId, setSelectedClassId] = React.useState("");
  const [enrolledAt, setEnrolledAt] = React.useState<Date | undefined>(
    new Date()
  );
  const [isCreating, setIsCreating] = React.useState(false);

  const activeEnrollments = enrollments.filter((e) => !e.leftAt);
  const pastEnrollments = enrollments.filter((e) => e.leftAt);

  const handleAssign = async () => {
    if (!selectedClassId || !enrolledAt) return;
    setIsCreating(true);

    const enrolledAtStr = enrolledAt.toISOString().split("T")[0];

    await handleAction({
      action: () =>
        createEnrollmentAction(studentId, selectedClassId, enrolledAtStr),
      successMessage: tS("enrollmentCreated"),
      errorMessage: tS("enrollmentCreateError"),
      onSuccess: () => {
        setDialogOpen(false);
        setSelectedClassId("");
        // Reload page to get fresh data
        window.location.reload();
      },
    });

    setIsCreating(false);
  };

  const handleMarkAsLeft = async (enrollmentId: string) => {
    const today = new Date().toISOString().split("T")[0];

    await handleAction({
      action: () => updateEnrollmentAction(enrollmentId, today),
      successMessage: tS("enrollmentUpdated"),
      errorMessage: tS("enrollmentUpdateError"),
      onSuccess: () => {
        setEnrollments((prev) =>
          prev.map((e) =>
            e.id === enrollmentId ? { ...e, leftAt: today } : e
          )
        );
      },
    });
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("de-CH");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{tS("classEnrollments")}</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {tS("assignClass")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{tS("assignClass")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{tS("selectClass")}</Label>
                  <Select
                    value={selectedClassId}
                    onValueChange={setSelectedClassId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={tS("selectClass")} />
                    </SelectTrigger>
                    <SelectContent>
                      {schoolClasses.map((sc) => (
                        <SelectItem key={sc.id} value={sc.id}>
                          {sc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{tS("enrolledAt")}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !enrolledAt && "text-muted-foreground"
                        )}
                      >
                        {enrolledAt ? (
                          format(enrolledAt, "PPP", { locale: de })
                        ) : (
                          <span>{tCommon("pickADate")}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={enrolledAt}
                        onSelect={setEnrolledAt}
                        captionLayout="dropdown"
                        locale={de}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button
                  onClick={handleAssign}
                  disabled={isCreating || !selectedClassId || !enrolledAt}
                  className="w-full"
                >
                  {tS("assignClass")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{tS("noEnrollments")}</p>
        ) : (
          <div className="space-y-4">
            {activeEnrollments.length > 0 && (
              <div className="space-y-2">
                {activeEnrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between rounded-md border px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="default">{tS("currentClass")}</Badge>
                      <span className="font-medium">
                        {enrollment.schoolClass.name}
                      </span>
                      {enrollment.schoolClass.gradeLevels?.map((gl) => (
                        <Badge key={gl.id} variant="secondary">
                          {gl.name}
                        </Badge>
                      ))}
                      <span className="text-sm text-muted-foreground">
                        {tS("enrolledAt")}: {formatDate(enrollment.enrolledAt)}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsLeft(enrollment.id)}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {tS("markAsLeft")}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {pastEnrollments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  {tS("pastClasses")}
                </h4>
                {pastEnrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center gap-3 rounded-md border px-4 py-3 opacity-60"
                  >
                    <span className="font-medium">
                      {enrollment.schoolClass.name}
                    </span>
                    {enrollment.schoolClass.gradeLevels?.map((gl) => (
                      <Badge key={gl.id} variant="outline">
                        {gl.name}
                      </Badge>
                    ))}
                    <span className="text-sm text-muted-foreground">
                      {formatDate(enrollment.enrolledAt)} &ndash;{" "}
                      {formatDate(enrollment.leftAt!)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
