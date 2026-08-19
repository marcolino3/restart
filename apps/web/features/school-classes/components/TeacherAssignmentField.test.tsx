import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { useForm } from "react-hook-form";

import { Form } from "@/components/ui/form";
import { TeacherAssignmentField } from "./TeacherAssignmentField";
import type { TeacherOption } from "../actions/get-teachers.action";

const messages = {
  SchoolClasses: {
    role: "Rolle",
    roleLead: "Klassenlehrperson",
    roleAssistant: "Assistenz",
    workloadPercent: "Pensum",
    assignTeacher: "Lehrperson zuweisen",
    removeTeacher: "Lehrperson entfernen",
    unknownTeacher: "Unbekannt",
    allTeachersAssigned: "Alle zugewiesen",
    noTeachers: "Keine Lehrpersonen",
  },
};

const teachers: TeacherOption[] = [
  { id: "t1", firstName: "Anna", lastName: "Meier" } as TeacherOption,
];

/** Exposes the live form state so assertions can read what would be submitted. */
function Harness({
  onState,
}: {
  onState: (values: Record<string, unknown>) => void;
}) {
  const form = useForm({
    defaultValues: {
      teachers: [{ employeeId: "t1", role: "LEAD", workloadPercent: 60 }],
    },
  });
  onState(form.watch() as Record<string, unknown>);
  return (
    <NextIntlClientProvider locale="de" messages={messages}>
      <Form {...form}>
        <TeacherAssignmentField name="teachers" teachers={teachers} />
      </Form>
    </NextIntlClientProvider>
  );
}

describe("TeacherAssignmentField", () => {
  it("stores the workload as a number rather than a string", async () => {
    const user = userEvent.setup();
    let values: Record<string, unknown> = {};
    render(<Harness onState={(v) => (values = v)} />);

    const input = screen.getByLabelText("Pensum");
    await user.clear(input);
    await user.type(input, "80");

    const rows = values.teachers as { workloadPercent: unknown }[];
    expect(rows[0].workloadPercent).toBe(80);
  });

  it("clears the workload to null instead of coercing it to zero", async () => {
    const user = userEvent.setup();
    let values: Record<string, unknown> = {};
    render(<Harness onState={(v) => (values = v)} />);

    await user.clear(screen.getByLabelText("Pensum"));

    // "not tracked" must stay distinguishable from a real 0 % workload.
    const rows = values.teachers as { workloadPercent: unknown }[];
    expect(rows[0].workloadPercent).toBeNull();
  });
});
