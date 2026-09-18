import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ColumnDef } from "@tanstack/react-table";
import { type AppTableFeatures, useDataTable } from "./use-data-table";

vi.mock("next-intl", () => ({
  useLocale: () => "de",
  useTranslations: () => (key: string) => key,
}));

type Row = Record<string, unknown> & { id: string; name: string };

const rows: Row[] = Array.from({ length: 30 }, (_, i) => ({
  id: String(i),
  name: `Row ${i}`,
}));

const columns: ColumnDef<AppTableFeatures, Row, unknown>[] = [
  { id: "name", accessorKey: "name" },
];

describe("useDataTable pagination", () => {
  it("keeps the page after nextPage() across re-renders", () => {
    const { result, rerender } = renderHook(() =>
      useDataTable({ data: rows, columns, initialPageSize: 10 }),
    );

    act(() => result.current.table.nextPage());
    rerender();

    expect(result.current.table.state.pagination.pageIndex).toBe(1);
    expect(result.current.table.getRowModel().rows[0]?.original.id).toBe("10");
  });

  it("jumps back to the first page when the search changes", () => {
    const { result, rerender } = renderHook(() =>
      useDataTable({ data: rows, columns, initialPageSize: 10 }),
    );

    act(() => result.current.table.nextPage());
    act(() => result.current.setGlobalFilter("Row"));
    rerender();

    expect(result.current.table.state.pagination.pageIndex).toBe(0);
  });
});
