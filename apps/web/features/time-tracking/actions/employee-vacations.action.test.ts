import { describe, it, expect, vi, beforeEach } from "vitest";

const request = vi.fn();

vi.mock("@/lib/graphql/server-cookie-graphql-client", () => ({
  serverCookieGqlClient: vi.fn(async () => ({ request })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next-intl/server", () => ({ getLocale: vi.fn(async () => "de") }));

import {
  getEmployeeVacationSegmentsAction,
  createEmployeeVacationAction,
  updateEmployeeVacationAction,
  deleteEmployeeVacationAction,
} from "./employee-vacations.action";

describe("employee-vacations actions", () => {
  beforeEach(() => {
    request.mockReset();
  });

  it("getEmployeeVacationSegmentsAction returns segments on success", async () => {
    const segments = [
      {
        id: "seg-1",
        employeeVacationId: "vac-1",
        name: null,
        startDate: "2026-01-01",
        endDate: "2026-01-05",
        effectiveDays: 5,
        holidays: [],
        periodLabel: "Jan 2026",
        periodStartDate: "2026-01-01",
        periodEndDate: "2026-01-31",
        isSplit: false,
      },
    ];
    request.mockResolvedValueOnce({ employeeVacationSegments: segments });

    const result = await getEmployeeVacationSegmentsAction("emp-1");

    expect(result).toEqual({ success: true, data: segments });
    expect(request.mock.calls[0][1]).toEqual({ employeeId: "emp-1" });
  });

  it("getEmployeeVacationSegmentsAction defaults to empty array when data is nullish", async () => {
    request.mockResolvedValueOnce({ employeeVacationSegments: null });

    const result = await getEmployeeVacationSegmentsAction("emp-1");

    expect(result).toEqual({ success: true, data: [] });
  });

  it("getEmployeeVacationSegmentsAction returns success:false with message on error", async () => {
    request.mockRejectedValueOnce(new Error("boom"));

    const result = await getEmployeeVacationSegmentsAction("emp-1");

    expect(result).toEqual({ success: false, error: "boom" });
  });

  it("createEmployeeVacationAction sends input and revalidates on success", async () => {
    request.mockResolvedValueOnce({
      createEmployeeVacation: { id: "vac-1", accrualType: "CHARGED", remark: null },
    });

    const result = await createEmployeeVacationAction({
      employeeId: "emp-1",
      startDate: "2026-01-01",
      endDate: "2026-01-05",
      name: "Skiferien",
    });

    expect(result).toEqual({ success: true, data: true });
    expect(request.mock.calls[0][1]).toEqual({
      input: {
        employeeId: "emp-1",
        startDate: "2026-01-01",
        endDate: "2026-01-05",
        name: "Skiferien",
      },
    });
  });

  it("createEmployeeVacationAction returns success:false on error", async () => {
    const error = new Error("failed");
    request.mockRejectedValueOnce(error);

    const result = await createEmployeeVacationAction({
      employeeId: "emp-1",
      startDate: "2026-01-01",
      endDate: "2026-01-05",
    });

    expect(result).toEqual({ success: false, error });
  });

  it("updateEmployeeVacationAction sends input and revalidates on success", async () => {
    request.mockResolvedValueOnce({ updateEmployeeVacation: { id: "vac-1" } });

    const result = await updateEmployeeVacationAction(
      { id: "vac-1", name: "Neu" },
      "emp-1",
    );

    expect(result).toEqual({ success: true, data: true });
    expect(request.mock.calls[0][1]).toEqual({
      input: { id: "vac-1", name: "Neu" },
    });
  });

  it("updateEmployeeVacationAction returns success:false on error", async () => {
    const error = new Error("failed");
    request.mockRejectedValueOnce(error);

    const result = await updateEmployeeVacationAction(
      { id: "vac-1", name: "Neu" },
      "emp-1",
    );

    expect(result).toEqual({ success: false, error });
  });

  it("deleteEmployeeVacationAction deletes and revalidates on success", async () => {
    request.mockResolvedValueOnce({ deleteEmployeeVacation: true });

    const result = await deleteEmployeeVacationAction("vac-1", "emp-1");

    expect(result).toEqual({ success: true, data: true });
    expect(request.mock.calls[0][1]).toEqual({ id: "vac-1" });
  });

  it("deleteEmployeeVacationAction returns success:false on error", async () => {
    const error = new Error("failed");
    request.mockRejectedValueOnce(error);

    const result = await deleteEmployeeVacationAction("vac-1", "emp-1");

    expect(result).toEqual({ success: false, error });
  });
});
