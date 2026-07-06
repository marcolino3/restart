import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { AdmissionCardVisual } from "./AdmissionCard";
import { AdmissionsList } from "./AdmissionsList";
import type { KanbanApplication, KanbanStage } from "../types";

// i18n + avatar are mocked so we assert on stable, deterministic output.
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/features/students/components/StudentAvatar", () => ({
  StudentAvatar: () => null,
}));

const application = (
  overrides: Partial<KanbanApplication> = {},
): KanbanApplication => ({
  id: "app-1",
  admissionStageId: "stage-1",
  position: 0,
  childFirstName: "Lina",
  childLastName: "Muster",
  childDateOfBirth: "2019-04-01",
  childGender: "FEMALE",
  status: "ACTIVE",
  source: "PUBLIC_FORM",
  stageEnteredAt: "2025-01-01T00:00:00.000Z",
  familyId: "fam-1",
  family: {
    id: "fam-1",
    name: "Familie Muster",
    contactNames: ["Anna Muster"],
    primaryEmail: "anna@example.ch",
    primaryPhone: "+41 79 000 00 00",
    childrenCount: 2,
  },
  enrolledStudentId: null,
  desiredGradeLevelId: "g1",
  desiredGradeLevelName: "Stufe 1",
  desiredGradeLevelColor: "#fff",
  openRemindersCount: 0,
  overdueRemindersCount: 0,
  ...overrides,
});

const stage = (cardFields: string[] | null): KanbanStage => ({
  id: "stage-1",
  name: "Erstkontakt",
  slug: "erstkontakt",
  color: "#0EA5E9",
  position: 0,
  stageType: "INITIAL",
  isDefault: true,
  cardFields,
});

describe("AdmissionCardVisual (config-driven)", () => {
  it("renders only the configured fields", () => {
    render(
      <AdmissionCardVisual
        application={application()}
        cardFields={["familyName", "contactEmail"]}
      />,
    );
    expect(screen.getByText("Lina Muster")).toBeInTheDocument();
    expect(screen.getByText("Familie Muster")).toBeInTheDocument();
    expect(screen.getByText("anna@example.ch")).toBeInTheDocument();
    // Birth date is NOT in the configured set.
    expect(screen.queryByText("geb. 01.04.2019")).not.toBeInTheDocument();
  });

  it("falls back to the default field set when cardFields is null", () => {
    render(<AdmissionCardVisual application={application()} cardFields={null} />);
    // birthYear (Swiss-formatted birth date) is part of the default set.
    expect(screen.getByText("geb. 01.04.2019")).toBeInTheDocument();
    // contactEmail is not a default field.
    expect(screen.queryByText("anna@example.ch")).not.toBeInTheDocument();
  });
});

describe("AdmissionsList (config-driven columns)", () => {
  const onOpenCard = vi.fn();

  it("renders exactly the configured columns plus the fixed child column", () => {
    render(
      <AdmissionsList
        stages={[stage(null)]}
        tableColumns={["family", "status"]}
        applications={[application()]}
        onOpenCard={onOpenCard}
      />,
    );
    // Fixed child column header.
    expect(screen.getByText("listColChild")).toBeInTheDocument();
    // Configured columns (label keys via mocked t()).
    expect(screen.getByText("listColFamily")).toBeInTheDocument();
    expect(screen.getByText("fieldStatus")).toBeInTheDocument();
    // A non-configured column header must be absent.
    expect(screen.queryByText("listColSource")).not.toBeInTheDocument();
  });
});
