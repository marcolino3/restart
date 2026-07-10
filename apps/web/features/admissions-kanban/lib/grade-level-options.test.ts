import { describe, it, expect } from "vitest";
import {
  buildGradeLevelOptions,
  expandGradeLevelFilter,
  GRADE_LEVEL_SUBGROUP_PREFIX,
} from "./grade-level-options";
import type { GradeLevelOption } from "../components/CreateApplicationDialog";

const P = GRADE_LEVEL_SUBGROUP_PREFIX;

describe("buildGradeLevelOptions", () => {
  it("renders a flat list unchanged when no Stufe has subgroups", () => {
    const levels: GradeLevelOption[] = [
      { id: "b", name: "Sekundarstufe", parentId: null, sortOrder: 2 },
      { id: "a", name: "Primarstufe", parentId: null, sortOrder: 1 },
    ];
    expect(buildGradeLevelOptions(levels)).toEqual([
      { value: "a", label: "Primarstufe" },
      { value: "b", label: "Sekundarstufe" },
    ]);
  });

  it("indents subgroups directly under their parent Stufe, in order", () => {
    const levels: GradeLevelOption[] = [
      { id: "sek", name: "Sekundarstufe", parentId: null, sortOrder: 2 },
      { id: "prim", name: "Primarstufe", parentId: null, sortOrder: 1 },
      { id: "prim-b", name: "Klasse B", parentId: "prim", sortOrder: 2 },
      { id: "prim-a", name: "Klasse A", parentId: "prim", sortOrder: 1 },
      { id: "sek-a", name: "Klasse S1", parentId: "sek", sortOrder: 1 },
    ];
    expect(buildGradeLevelOptions(levels)).toEqual([
      { value: "prim", label: "Primarstufe" },
      { value: "prim-a", label: `${P}Klasse A` },
      { value: "prim-b", label: `${P}Klasse B` },
      { value: "sek", label: "Sekundarstufe" },
      { value: "sek-a", label: `${P}Klasse S1` },
    ]);
  });

  it("appends the short code to the label when present", () => {
    const levels: GradeLevelOption[] = [
      {
        id: "prim",
        name: "Primarstufe",
        shortCode: "PS",
        parentId: null,
        sortOrder: 1,
      },
      {
        id: "prim-a",
        name: "Klasse A",
        shortCode: "1A",
        parentId: "prim",
        sortOrder: 1,
      },
    ];
    expect(buildGradeLevelOptions(levels)).toEqual([
      { value: "prim", label: "Primarstufe (PS)" },
      { value: "prim-a", label: `${P}Klasse A (1A)` },
    ]);
  });

  it("keeps each level's own id as the option value (both are selectable)", () => {
    const levels: GradeLevelOption[] = [
      { id: "prim", name: "Primarstufe", parentId: null, sortOrder: 1 },
      { id: "prim-a", name: "Klasse A", parentId: "prim", sortOrder: 1 },
    ];
    const values = buildGradeLevelOptions(levels).map((o) => o.value);
    expect(values).toEqual(["prim", "prim-a"]);
  });
});

describe("expandGradeLevelFilter", () => {
  const levels: GradeLevelOption[] = [
    { id: "prim", name: "Primarstufe", parentId: null, sortOrder: 1 },
    { id: "prim-a", name: "Klasse A", parentId: "prim", sortOrder: 1 },
    { id: "prim-b", name: "Klasse B", parentId: "prim", sortOrder: 2 },
    { id: "sek", name: "Sekundarstufe", parentId: null, sortOrder: 2 },
    { id: "sek-a", name: "Klasse S1", parentId: "sek", sortOrder: 1 },
  ];

  it("returns an empty set for an empty selection (no filter)", () => {
    expect(expandGradeLevelFilter([], levels).size).toBe(0);
  });

  it("expands a selected Stufe to include all its subgroups", () => {
    const set = expandGradeLevelFilter(["prim"], levels);
    expect([...set].sort()).toEqual(["prim", "prim-a", "prim-b"]);
    // A different Stufe's subgroup is not included.
    expect(set.has("sek-a")).toBe(false);
  });

  it("keeps a selected Untergruppe narrow (no siblings, no parent)", () => {
    const set = expandGradeLevelFilter(["prim-a"], levels);
    expect([...set]).toEqual(["prim-a"]);
  });

  it("unions multiple selections", () => {
    const set = expandGradeLevelFilter(["prim-a", "sek"], levels);
    expect([...set].sort()).toEqual(["prim-a", "sek", "sek-a"]);
  });
});
