import { describe, expect, it } from "vitest";
import { buildEquipPool, detectConflict, isExclusionZone, overlaps, type PlacedJob } from "./assess";
import type { Equipment, Sector } from "../types";

const sectors: Sector[] = [
  { id: 1, name: "Track 12", exclusion_zone: ["Track 14"] },
  { id: 2, name: "Track 14", exclusion_zone: [] },
  { id: 3, name: "Depot C", exclusion_zone: [] },
];

const placed: PlacedJob[] = [
  { id: 1, location: "Track 12", start: 60, end: 120, crewId: 1, required_equipment: ["work_train"], work_tags: ["electrical"] },
];

describe("overlaps", () => {
  it("detects overlapping and touching intervals correctly", () => {
    expect(overlaps(0, 60, 30, 90)).toBe(true);
    expect(overlaps(0, 60, 60, 120)).toBe(false);
    expect(overlaps(30, 90, 0, 120)).toBe(true);
    expect(overlaps(0, 30, 60, 90)).toBe(false);
  });
});

describe("isExclusionZone", () => {
  it("detects direct and reverse exclusion-zone relationships", () => {
    expect(isExclusionZone("Track 12", "Track 14", sectors)).toBe(true);
    expect(isExclusionZone("Track 14", "Track 12", sectors)).toBe(true);
    expect(isExclusionZone("Track 12", "Track 12", sectors)).toBe(false);
    expect(isExclusionZone("Track 12", "Depot C", sectors)).toBe(false);
  });
});

describe("buildEquipPool", () => {
  it("maps equipment availability and increments extras", () => {
    const equipment: Equipment[] = [
      { id: 1, name: "work_train", type: "vehicle", available: true },
      { id: 2, name: "rail_grinder", type: "vehicle", available: false },
    ];
    const pool = buildEquipPool(equipment, ["work_train", "signal_tester"]);

    expect(pool.get("work_train")).toBe(2);
    expect(pool.get("rail_grinder")).toBe(0);
    expect(pool.get("signal_tester")).toBe(1);
  });
});

describe("detectConflict", () => {
  it("detects same sector, exclusion-zone, incompatible work, crew, and equipment conflicts", () => {
    expect(detectConflict({ location: "Track 12", start: 90, end: 150, crewId: 2, required_equipment: [], work_tags: [] }, placed, sectors, new Map())).toEqual({ reason: "Same sector time overlap", kind: "sector" });
    expect(detectConflict({ location: "Track 14", start: 90, end: 150, crewId: 2, required_equipment: [], work_tags: [] }, placed, sectors, new Map())).toEqual({ reason: "Adjacent sector exclusion", kind: "sector" });
    expect(detectConflict({ location: "Depot C", start: 90, end: 150, crewId: 2, required_equipment: [], work_tags: ["water"] }, placed, sectors, new Map())).toEqual({ reason: "Incompatible work types", kind: "sector" });
    expect(detectConflict({ location: "Depot C", start: 90, end: 150, crewId: 1, required_equipment: [], work_tags: [] }, placed, sectors, new Map())).toEqual({ reason: "Crew double-booked", kind: "crew" });
    expect(detectConflict({ location: "Depot C", start: 90, end: 150, crewId: 2, required_equipment: ["work_train"], work_tags: [] }, placed, sectors, new Map([["work_train", 1]]))).toEqual({ reason: "Equipment conflict", kind: "equipment" });
  });

  it("returns null when jobs do not overlap", () => {
    expect(detectConflict({ location: "Track 12", start: 120, end: 180, crewId: 1, required_equipment: ["work_train"], work_tags: ["electrical"] }, placed, sectors, new Map([["work_train", 1]]))).toBeNull();
  });
});
