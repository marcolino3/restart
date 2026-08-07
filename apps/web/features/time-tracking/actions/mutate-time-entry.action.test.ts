import { describe, it, expect, vi, beforeEach } from "vitest";
import { ClientError } from "graphql-request";

const request = vi.fn();

vi.mock("@/lib/graphql/server-cookie-graphql-client", () => ({
  serverCookieGqlClient: vi.fn(async () => ({ request })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next-intl/server", () => ({ getLocale: vi.fn(async () => "de") }));

import {
  createTimeEntryAction,
  updateTimeEntryAction,
  deleteTimeEntryAction,
} from "./mutate-time-entry.action";
import type { TimeEntryFormOutput } from "../schemas/time-entry-form.schema";

const values: TimeEntryFormOutput = {
  date: new Date("2026-01-15"),
  startTime: "08:00",
  endTime: "16:00",
  breakMinutes: 30,
  notes: "",
};

describe("mutate-time-entry actions", () => {
  beforeEach(() => {
    request.mockReset();
  });

  it("createTimeEntryAction converts form values into startedAt/endedAt ISO timestamps", async () => {
    request.mockResolvedValueOnce({ createTimeTracking: { id: "entry-1" } });

    const result = await createTimeEntryAction("emp-1", values);

    expect(result).toEqual({ success: true, data: { id: "entry-1" } });
    const [, variables] = request.mock.calls[0];
    expect(variables.input.employeeId).toBe("emp-1");
    expect(variables.input.breakMinutes).toBe(30);
    expect(new Date(variables.input.startedAt).getHours()).toBe(8);
    expect(new Date(variables.input.endedAt).getHours()).toBe(16);
  });

  it("updateTimeEntryAction returns success:false with the extracted GraphQL error code on failure", async () => {
    request.mockRejectedValueOnce(
      new ClientError(
        { errors: [{ message: "DUPLICATE_DAY_ENTRY" }] } as never,
        { query: "" },
      ),
    );

    const result = await updateTimeEntryAction("entry-1", values);

    expect(result).toEqual({ success: false, error: "DUPLICATE_DAY_ENTRY" });
  });

  it("deleteTimeEntryAction returns success:true on a clean delete", async () => {
    request.mockResolvedValueOnce(undefined);

    const result = await deleteTimeEntryAction("entry-1");

    expect(result).toEqual({ success: true, data: true });
    expect(request.mock.calls[0][1]).toEqual({ id: "entry-1" });
  });
});
