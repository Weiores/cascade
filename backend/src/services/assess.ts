import type { Equipment, Sector } from "../types";

export interface PlacedJob {
  id: number;
  location: string;
  start: number;
  end: number;
  crewId: number;
  required_equipment: string[];
  work_tags: string[];
}

export type ConflictKind = "crew" | "equipment" | "sector" | "time";

const INCOMPATIBLE: [string, string][] = [
  ["electrical", "water"],
  ["hot_work", "electrical"],
];

export function isExclusionZone(a: string, b: string, sectors: Sector[]): boolean {
  if (a === b) return false;
  return sectors.some(
    (s) =>
      (s.name === a && s.exclusion_zone.includes(b)) ||
      (s.name === b && s.exclusion_zone.includes(a))
  );
}

export function buildEquipPool(equipment: Equipment[], extras: string[] = []): Map<string, number> {
  const pool = new Map<string, number>();
  for (const e of equipment) pool.set(e.name, e.available ? 1 : 0);
  for (const name of extras) pool.set(name, (pool.get(name) ?? 0) + 1);
  return pool;
}

export function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function detectConflict(
  candidate: {
    location: string;
    start: number;
    end: number;
    crewId: number;
    required_equipment: string[];
    work_tags: string[];
  },
  placed: PlacedJob[],
  sectors: Sector[],
  equipPool: Map<string, number>
): { reason: string; kind: ConflictKind } | null {
  for (const p of placed) {
    if (!overlaps(candidate.start, candidate.end, p.start, p.end)) continue;

    if (candidate.location === p.location) {
      return { reason: "Same sector time overlap", kind: "sector" };
    }
    if (isExclusionZone(candidate.location, p.location, sectors)) {
      return { reason: "Adjacent sector exclusion", kind: "sector" };
    }
    const incompatible = INCOMPATIBLE.some(
      ([x, y]) =>
        (candidate.work_tags.includes(x) && p.work_tags.includes(y)) ||
        (candidate.work_tags.includes(y) && p.work_tags.includes(x))
    );
    if (incompatible) {
      return { reason: "Incompatible work types", kind: "sector" };
    }
    if (candidate.crewId === p.crewId) {
      return { reason: "Crew double-booked", kind: "crew" };
    }
    const equipContention = candidate.required_equipment.some(
      (e) => p.required_equipment.includes(e) && (equipPool.get(e) ?? 1) < 2
    );
    if (equipContention) {
      return { reason: "Equipment conflict", kind: "equipment" };
    }
  }
  return null;
}
