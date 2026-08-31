import { beforeEach, describe, expect, it, vi } from "vitest";

const request = vi.fn();

vi.mock("@/lib/graphql/server-cookie-graphql-client", () => ({
  serverCookieGqlClient: vi.fn(async () => ({ request })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { createEmployeeAbsenceNoticeAction } from "./create-employee-absence-notice.action";

const baseValues = {
  absenceCategoryId: "cat-1",
  startDate: new Date(2026, 7, 25, 12),
  endDate: undefined,
  note: "",
  isTeamInformed: true,
  dayPart: "FULL" as const,
};

describe("createEmployeeAbsenceNoticeAction", () => {
  beforeEach(() => {
    request.mockReset();
    request.mockResolvedValue({ createEmployeeAbsenceNotice: { id: "abs-1" } });
  });

  it("sends calendar dates and never the form-only entryMode", async () => {
    // Regression: the schema defaults entryMode, which the API does not know.
    const result = await createEmployeeAbsenceNoticeAction({
      ...baseValues,
      entryMode: "DAY",
    });

    expect(result.success).toBe(true);
    const [, variables] = request.mock.calls[0] as [
      unknown,
      { createEmployeeAbsenceInput: Record<string, unknown> },
    ];
    const input = variables.createEmployeeAbsenceInput;
    expect(input).not.toHaveProperty("entryMode");
    expect(input.startDate).toBe("2026-08-25");
    expect(input.endDate).toBeNull();
  });

  it("passes times and day part through for time-of-day notices", async () => {
    await createEmployeeAbsenceNoticeAction({
      ...baseValues,
      entryMode: "TIME",
      startTime: "15:00",
      endTime: undefined,
    });

    const [, variables] = request.mock.calls[0] as [
      unknown,
      { createEmployeeAbsenceInput: Record<string, unknown> },
    ];
    expect(variables.createEmployeeAbsenceInput).toMatchObject({
      startTime: "15:00",
      dayPart: "FULL",
    });
    expect(variables.createEmployeeAbsenceInput).not.toHaveProperty(
      "entryMode",
    );
  });

  it("returns the backend message on failure", async () => {
    request.mockRejectedValueOnce({
      response: {
        errors: [
          {
            message:
              "This employee already has an absence recorded for one of the selected days.",
          },
        ],
      },
    });

    const result = await createEmployeeAbsenceNoticeAction(baseValues);

    expect(result.success).toBe(false);
    expect(result.message).toContain("already has an absence");
  });
});
