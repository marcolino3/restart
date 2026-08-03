import { describe, expect, it } from "vitest";
import {
  isContractValidOn,
  pickOverviewContract,
} from "./pick-overview-contract";

const today = "2026-08-03";

describe("isContractValidOn", () => {
  it("accepts open-ended contracts that have started", () => {
    expect(
      isContractValidOn({ startDate: "2026-01-01", endDate: null }, today),
    ).toBe(true);
  });

  it("accepts contracts ending today", () => {
    expect(
      isContractValidOn(
        { startDate: "2026-01-01", endDate: "2026-08-03" },
        today,
      ),
    ).toBe(true);
  });

  it("rejects contracts that end before today", () => {
    expect(
      isContractValidOn(
        { startDate: "2025-01-01", endDate: "2026-08-02" },
        today,
      ),
    ).toBe(false);
  });

  it("rejects future starts", () => {
    expect(
      isContractValidOn({ startDate: "2026-09-01", endDate: null }, today),
    ).toBe(false);
  });
});

describe("pickOverviewContract", () => {
  it("prefers the contract valid today", () => {
    const result = pickOverviewContract(
      [
        {
          id: "old",
          startDate: "2024-01-01",
          endDate: "2026-08-02",
          isActive: true,
        },
        {
          id: "current",
          startDate: "2026-08-03",
          endDate: null,
          isActive: true,
        },
      ],
      today,
    );
    expect(result.contract?.id).toBe("current");
    expect(result.expired).toBe(false);
  });

  it("falls back to the last past contract as expired", () => {
    const result = pickOverviewContract(
      [
        {
          id: "older",
          startDate: "2023-01-01",
          endDate: "2024-12-31",
          isActive: true,
        },
        {
          id: "last",
          startDate: "2025-01-01",
          endDate: "2026-06-30",
          isActive: true,
        },
      ],
      today,
    );
    expect(result.contract?.id).toBe("last");
    expect(result.expired).toBe(true);
  });

  it("falls back to the soonest future contract when none has started", () => {
    const result = pickOverviewContract(
      [
        {
          id: "later",
          startDate: "2026-11-01",
          endDate: null,
          isActive: true,
        },
        {
          id: "soon",
          startDate: "2026-09-01",
          endDate: null,
          isActive: true,
        },
      ],
      today,
    );
    expect(result.contract?.id).toBe("soon");
    expect(result.expired).toBe(false);
  });

  it("prefers an expired past contract over a future one", () => {
    const result = pickOverviewContract(
      [
        {
          id: "past",
          startDate: "2025-01-01",
          endDate: "2026-06-30",
          isActive: true,
        },
        {
          id: "future",
          startDate: "2026-09-01",
          endDate: null,
          isActive: true,
        },
      ],
      today,
    );
    expect(result.contract?.id).toBe("past");
    expect(result.expired).toBe(true);
  });

  it("ignores soft-deleted contracts", () => {
    const result = pickOverviewContract(
      [
        {
          id: "deleted",
          startDate: "2026-01-01",
          endDate: null,
          isActive: false,
        },
      ],
      today,
    );
    expect(result.contract).toBeUndefined();
  });
});
