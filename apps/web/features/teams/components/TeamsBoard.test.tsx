import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TeamsBoard } from "./TeamsBoard";
import type { TeamItem } from "../actions/get-teams.action";
import type { OrgTeamMemberItem } from "../actions/get-all-team-members.action";
import type { EmployeeListItem } from "@/features/employees/actions/get-employees.action";

// next-intl: return the key, but keep `.rich` working for dragMemberHint.
vi.mock("next-intl", () => {
  const t = ((key: string) => key) as ((key: string) => string) & {
    rich: (key: string) => string;
  };
  t.rich = (key: string) => key;
  return {
    useTranslations: () => t,
    useLocale: () => "de",
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const removeTeamMemberAction = vi.fn().mockResolvedValue({ success: true });
const moveTeamMemberAction = vi.fn().mockResolvedValue({ success: true });
const addTeamMemberAction = vi
  .fn()
  .mockResolvedValue({ success: true, data: { id: "new", role: "MEMBER" } });
const createTeamAction = vi.fn();
const updateTeamAction = vi.fn();
const deleteTeamAction = vi.fn();

vi.mock("../actions/remove-team-member.action", () => ({
  removeTeamMemberAction: (...args: unknown[]) =>
    removeTeamMemberAction(...args),
}));
vi.mock("../actions/move-team-member.action", () => ({
  moveTeamMemberAction: (...args: unknown[]) => moveTeamMemberAction(...args),
}));
vi.mock("../actions/add-team-member.action", () => ({
  addTeamMemberAction: (...args: unknown[]) => addTeamMemberAction(...args),
}));
vi.mock("../actions/create-team.action", () => ({
  createTeamAction: (...args: unknown[]) => createTeamAction(...args),
}));
vi.mock("../actions/update-team.action", () => ({
  updateTeamAction: (...args: unknown[]) => updateTeamAction(...args),
}));
vi.mock("../actions/delete-team.action", () => ({
  deleteTeamAction: (...args: unknown[]) => deleteTeamAction(...args),
}));

// Keep the AlertDialog out of the way — we only assert the ✕ remove button.
vi.mock("@/components/common/DeleteConfirmationDialog", () => ({
  DeleteConfirmationDialog: ({ trigger }: { trigger?: ReactNode }) =>
    trigger ?? <button>delete</button>,
}));

const team = (id: string, name: string, sortOrder: number): TeamItem => ({
  id,
  name,
  sortOrder,
  parentId: null,
});

const member = (
  id: string,
  teamId: string,
  first: string,
  last: string,
  role: "MEMBER" | "LEAD" = "MEMBER",
  employeeId = id,
): OrgTeamMemberItem => ({
  id,
  role,
  team: { id: teamId },
  employee: {
    id: employeeId,
    isActive: true,
    membership: {
      user: {
        id: employeeId,
        firstName: first,
        lastName: last,
        userEmails: [{ email: `${first}@school.ch`, isPrimary: true }],
      },
    },
  },
});

const employee = (empId: string, first: string, last: string): EmployeeListItem => ({
  membership: {
    employee: {
      isActive: true,
      timeTrackingEnabled: false,
      id: empId,
    },
    user: {
      firstName: first,
      id: empId,
      lastName: last,
      userEmails: [{ email: `${first}@school.ch`, isPrimary: true }],
    },
    persona: "EMPLOYEE",
    contactPhone: null,
  },
  teamMembers: [],
});

const teams = [team("t1", "Primaria-Team", 0), team("t2", "Kinderhaus-Team", 1)];
const members = [
  member("m1", "t1", "Anna", "Meier", "LEAD"),
  member("m2", "t1", "Marc", "Steiner"),
  member("m3", "t2", "Nora", "Odermatt", "LEAD"),
];
const employees = [
  employee("e-esra", "Esra", "Yildiz"),
  employee("m1", "Anna", "Meier"),
  employee("m2", "Marc", "Steiner"),
];

describe("TeamsBoard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders a card per team with member names and the member count", () => {
    render(
      <TeamsBoard
        initialTeams={teams}
        initialMembers={members}
        employees={employees}
      />,
    );

    expect(screen.getByText("Primaria-Team")).toBeInTheDocument();
    expect(screen.getByText("Kinderhaus-Team")).toBeInTheDocument();
    expect(screen.getByText("Anna Meier")).toBeInTheDocument();
    expect(screen.getByText("Marc Steiner")).toBeInTheDocument();
    // Primaria has 2 members, Kinderhaus 1 → both counts present.
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("shows the empty state when there are no teams", () => {
    render(
      <TeamsBoard initialTeams={[]} initialMembers={[]} employees={employees} />,
    );
    expect(screen.getByText("noTeamsFound")).toBeInTheDocument();
  });

  it("removes a member via the ✕ button", async () => {
    const user = userEvent.setup();
    render(
      <TeamsBoard
        initialTeams={teams}
        initialMembers={members}
        employees={employees}
      />,
    );

    const removeButtons = screen.getAllByRole("button", {
      name: "removeMember",
    });
    await user.click(removeButtons[0]);

    expect(removeTeamMemberAction).toHaveBeenCalledTimes(1);
    // called with (teamMemberId, teamId)
    expect(removeTeamMemberAction).toHaveBeenCalledWith("m1", "t1");
  });

  it("opens the add-member dialog from a team card", async () => {
    const user = userEvent.setup();
    render(
      <TeamsBoard
        initialTeams={teams}
        initialMembers={members}
        employees={employees}
      />,
    );

    const addButtons = screen.getAllByRole("button", { name: /addMember/ });
    await user.click(addButtons[0]);

    // Dialog title uses addMemberToTeam action + functionInTeam section.
    expect(screen.getByText("functionInTeam")).toBeInTheDocument();
  });

  it("opens the create-team dialog from the page action", async () => {
    const user = userEvent.setup();
    render(
      <TeamsBoard
        initialTeams={teams}
        initialMembers={members}
        employees={employees}
      />,
    );

    await user.click(screen.getByRole("button", { name: "newTeam" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("newTeam")).toBeInTheDocument();
  });
});
