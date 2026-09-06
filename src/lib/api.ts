import { SCHEDULE_DATE, seedCrews, seedEquipment, seedRequests, seedSectors } from "./mockData";
import type {
  BottleneckBreakdown,
  ConflictSuggestion,
  Crew,
  DashboardStats,
  Equipment,
  MaintenanceRequest,
  NewRequestInput,
  OptimiseResult,
  RequestStatus,
  ScheduleForDate,
  WhatIfInput,
  WhatIfResult,
} from "./types";
import { isoToTime, timeToMinutes } from "./utils";

/**
 * Mock API implementing the exact backend contract.
 * Swap BASE_URL-backed fetch calls in later — signatures stay identical.
 */

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

// ---------- mutable in-memory store ----------
let requests: MaintenanceRequest[] = clone(seedRequests);
const crews: Crew[] = clone(seedCrews);
const equipment: Equipment[] = clone(seedEquipment);
const sectors = clone(seedSectors);
let nextId = 11;
let lastRun: OptimiseResult | null = null;

// ---------- trust engine ----------
export function computeTrustScore(title: string, type: string): number {
  if (type !== "predictive") {
    return type === "planned" ? 95 : type === "routine" ? 90 : 75;
  }
  let score = 60 + Math.floor(Math.random() * 36); // 60-95
  if (/single sensor/i.test(title)) score -= 20;
  if (/anomaly|unusual/i.test(title)) score -= 15;
  return Math.max(10, Math.min(100, score));
}

export function computeFinalPriority(priority: number, trust: number): number {
  return Math.round(priority * 0.6 + trust * 0.4);
}

// ---------- scheduling core ----------
const INCOMPATIBLE: [string, string][] = [
  ["electrical", "water"],
  ["hot_work", "electrical"],
];

function isExclusionZone(a: string, b: string): boolean {
  if (a === b) return false;
  return sectors.some(
    (s) => (s.name === a && s.exclusion_zone.includes(b)) || (s.name === b && s.exclusion_zone.includes(a))
  );
}

function sharesIncompatibleWork(a: MaintenanceRequest, b: MaintenanceRequest): boolean {
  return INCOMPATIBLE.some(
    ([x, y]) =>
      (a.work_compatibility_tags.includes(x) && b.work_compatibility_tags.includes(y)) ||
      (a.work_compatibility_tags.includes(y) && b.work_compatibility_tags.includes(x))
  );
}

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) => aStart < bEnd && bStart < aEnd;

interface SlotJob {
  req: MaintenanceRequest;
  start: number;
  end: number;
  crewId: number;
}

function conflictBetween(
  cand: MaintenanceRequest,
  cStart: number,
  cEnd: number,
  cCrewId: number,
  placed: SlotJob,
  equipPool: Map<string, number>
): string | null {
  const s = placed.req;
  if (!overlaps(cStart, cEnd, placed.start, placed.end)) return null;
  if (cand.location === s.location) return "Same sector time overlap";
  if (cCrewId === placed.crewId) return "Crew double-booked";
  if (
    cand.required_equipment.some((e) => s.required_equipment.includes(e)) &&
    cand.required_equipment.some((e) => (equipPool.get(e) ?? 1) < 2)
  )
    return "Equipment conflict";
  if (isExclusionZone(cand.location, s.location)) return "Adjacent sector exclusion";
  if (sharesIncompatibleWork(cand, s)) return "Incompatible work types";
  return null;
}

interface RunOutcome {
  placed: SlotJob[];
  results: MaintenanceRequest[];
  scheduled: number;
  deferred: number;
  breakdown: BottleneckBreakdown;
  bottleneck: string;
  utilisation: number;
}

function runScheduler(
  reqs: MaintenanceRequest[],
  crewPool: Crew[],
  equipPool: Map<string, number>,
  date: string
): RunOutcome {
  const placed: SlotJob[] = [];
  const breakdown: BottleneckBreakdown = { crew: 0, equipment: 0, sector: 0, time: 0 };
  const results: MaintenanceRequest[] = [];

  const sorted = [...reqs].sort((a, b) => b.final_priority - a.final_priority);

  for (const req of sorted) {
    const out = clone(req);
    out.status = "pending";
    out.scheduled_start = null;
    out.scheduled_end = null;
    out.assigned_crew_id = null;
    out.conflict_reason = null;

    const deadlineMin =
      (Date.parse(req.deadline) - Date.parse(`${date}T00:00:00`)) / 60000;

    const eligibleCrews = crewPool.filter((c) =>
      req.required_skills.every((s) => c.skills.includes(s))
    );

    if (eligibleCrews.length === 0) {
      out.status = "deferred";
      out.conflict_reason = "No crew with required skills";
      breakdown.crew++;
      results.push(out);
      continue;
    }
    if (req.required_equipment.some((e) => (equipPool.get(e) ?? 0) === 0)) {
      out.status = "deferred";
      out.conflict_reason = "Equipment unavailable";
      breakdown.equipment++;
      results.push(out);
      continue;
    }

    let bestReason: { reason: string; kind: keyof BottleneckBreakdown } | null = null;
    let assigned = false;

    outer: for (const crew of eligibleCrews) {
      const wStart = timeToMinutes(crew.available_start);
      const wEnd = timeToMinutes(crew.available_end);
      for (let t = wStart; t + req.duration_minutes <= wEnd; t += 15) {
        const end = t + req.duration_minutes;
        if (end > deadlineMin) {
          bestReason = { reason: "Cannot finish before deadline", kind: "time" };
          break;
        }
        const concurrent = placed.filter(
          (p) => p.crewId === crew.id && overlaps(t, end, p.start, p.end)
        ).length;
        if (concurrent >= crew.max_concurrent_jobs) {
          bestReason = { reason: "Crew double-booked", kind: "crew" };
          continue;
        }
        let conflict: string | null = null;
        let conflictKind: keyof BottleneckBreakdown = "sector";
        for (const p of placed) {
          const c = conflictBetween(req, t, end, crew.id, p, equipPool);
          if (c) {
            conflict = c;
            conflictKind =
              c === "Equipment conflict"
                ? "equipment"
                : c === "Crew double-booked"
                  ? "crew"
                  : c === "Incompatible work types" || c === "Same sector time overlap" || c === "Adjacent sector exclusion"
                    ? "sector"
                    : "time";
            break;
          }
        }
        if (conflict) {
          if (!bestReason) bestReason = { reason: conflict, kind: conflictKind };
          continue;
        }
        placed.push({ req, start: t, end, crewId: crew.id });
        out.status = "scheduled";
        out.scheduled_start = `${date}T${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}:00`;
        out.scheduled_end = `${date}T${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}:00`;
        out.assigned_crew_id = crew.id;
        assigned = true;
        break outer;
      }
    }

    if (!assigned) {
      const reason = bestReason ?? { reason: "No available slot in engineering window", kind: "time" as const };
      const capacityOnly =
        reason.reason === "Crew double-booked" || reason.reason === "Cannot finish before deadline" || reason.kind === "time";
      out.status = capacityOnly && reason.reason !== "Crew double-booked" ? "deferred" : "in_conflict";
      out.conflict_reason = reason.reason;
      breakdown[reason.kind]++;
      results.push(out);
    } else {
      results.push(out);
    }
  }

  const scheduledMin = placed.reduce((a, p) => a + (p.end - p.start), 0);
  const crewMin = crewPool.reduce(
    (a, c) => a + (timeToMinutes(c.available_end) - timeToMinutes(c.available_start)) * c.max_concurrent_jobs,
    0
  );
  const entries = Object.entries(breakdown) as [keyof BottleneckBreakdown, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const labels: Record<keyof BottleneckBreakdown, string> = {
    crew: "Crew availability",
    equipment: "Equipment",
    sector: "Sector access",
    time: "Engineering window",
  };
  const bottleneck = entries[0][1] > 0 ? labels[entries[0][0]] : "None";

  return {
    placed,
    results,
    scheduled: results.filter((r) => r.status === "scheduled").length,
    deferred: results.filter((r) => r.status === "deferred").length,
    breakdown,
    bottleneck,
    utilisation: crewMin > 0 ? Math.round((scheduledMin / crewMin) * 100) : 0,
  };
}

function defaultEquipPool(extra: string[] = []): Map<string, number> {
  const pool = new Map<string, number>();
  for (const e of equipment) pool.set(e.name, e.available ? 1 : 0);
  for (const name of extra) pool.set(name, (pool.get(name) ?? 0) + 1);
  return pool;
}

// ---------- endpoints ----------

export async function listRequests(status?: RequestStatus): Promise<MaintenanceRequest[]> {
  await delay();
  const list = status ? requests.filter((r) => r.status === status) : requests;
  return clone(list).sort((a, b) => b.final_priority - a.final_priority);
}

export async function createRequest(input: NewRequestInput): Promise<MaintenanceRequest> {
  await delay();
  const trust = computeTrustScore(input.title, input.type);
  const req: MaintenanceRequest = {
    ...input,
    id: nextId++,
    trust_score: trust,
    final_priority: computeFinalPriority(input.priority_score, trust),
    status: "pending",
    scheduled_start: null,
    scheduled_end: null,
    assigned_crew_id: null,
    conflict_reason: null,
  };
  requests.push(req);
  return clone(req);
}

export async function optimise(date: string): Promise<OptimiseResult> {
  await delay(700);
  const pending = requests.filter((r) => r.status !== "deferred");
  const outcome = runScheduler(pending, crews, defaultEquipPool(), date);
  const deferredKept = requests.filter((r) => r.status === "deferred");
  requests = [...outcome.results, ...clone(deferredKept)];
  lastRun = {
    schedule: outcome.results.filter((r) => r.status === "scheduled"),
    conflicts: outcome.results.filter((r) => r.status === "in_conflict"),
    deferred: outcome.results.filter((r) => r.status === "deferred"),
    bottleneck: outcome.bottleneck,
    bottleneck_breakdown: outcome.breakdown,
    utilisation_rate: outcome.utilisation,
  };
  return clone(lastRun);
}

export async function getSchedule(date: string): Promise<ScheduleForDate> {
  await delay();
  return {
    date,
    schedule: clone(requests.filter((r) => r.status === "scheduled")),
    conflicts: clone(requests.filter((r) => r.status === "in_conflict")),
    deferred: clone(requests.filter((r) => r.status === "deferred")),
    bottleneck: lastRun?.bottleneck ?? null,
    bottleneck_breakdown: lastRun?.bottleneck_breakdown ?? null,
    utilisation_rate: lastRun?.utilisation_rate ?? null,
    crews: clone(crews),
  };
}

export async function getConflictSuggestions(id: number): Promise<ConflictSuggestion[]> {
  await delay(500);
  const req = requests.find((r) => r.id === id);
  if (!req) return [];
  const suggestions: ConflictSuggestion[] = [];

  const scheduled = requests.filter((r) => r.status === "scheduled");
  const sameLoc = scheduled.find((r) => r.location === req.location);
  if (sameLoc && sameLoc.scheduled_end) {
    const endMin = timeToMinutes(isoToTime(sameLoc.scheduled_end));
    const newEnd = endMin + req.duration_minutes;
    if (newEnd <= 360) {
      const fmt = (m: number) =>
        `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
      suggestions.push({
        type: "change_time",
        description: `Move to ${fmt(endMin)}–${fmt(newEnd)}, right after Job #${sameLoc.id} clears ${req.location}`,
        new_start: `${SCHEDULE_DATE}T${fmt(endMin)}:00`,
        new_end: `${SCHEDULE_DATE}T${fmt(newEnd)}:00`,
      });
    }
  }

  const otherCrew = crews.find(
    (c) => c.id !== req.assigned_crew_id && req.required_skills.every((s) => c.skills.includes(s))
  );
  if (otherCrew) {
    suggestions.push({
      type: "change_crew",
      description: `Assign to ${otherCrew.name} (available ${otherCrew.available_start}–${otherCrew.available_end})`,
      new_crew_id: otherCrew.id,
    });
  }

  if (sameLoc) {
    suggestions.push({
      type: "bundle",
      description: `Bundle with Job #${sameLoc.id} at ${req.location} — share track access and one possession`,
      bundle_with_id: sameLoc.id,
    });
  }

  if (req.duration_minutes > 60) {
    suggestions.push({
      type: "split",
      description: `Split into 2 sessions of ${Math.round(req.duration_minutes / 2)} min across consecutive nights`,
    });
  }

  suggestions.push({
    type: "defer",
    description: "Defer to next available night (2026-09-02), priority carried over",
    defer_to_date: "2026-09-02",
  });

  return suggestions.slice(0, 4);
}

export async function applySuggestion(id: number, suggestion: ConflictSuggestion): Promise<void> {
  await delay();
  const req = requests.find((r) => r.id === id);
  if (!req) return;
  if (suggestion.type === "defer") {
    req.status = "deferred";
    req.conflict_reason = null;
  } else {
    req.status = "scheduled";
    req.conflict_reason = null;
    if (suggestion.type === "change_time") {
      req.scheduled_start = suggestion.new_start;
      req.scheduled_end = suggestion.new_end;
      req.assigned_crew_id = 1;
    }
    if (suggestion.type === "change_crew") {
      req.assigned_crew_id = suggestion.new_crew_id;
      if (!req.scheduled_start) {
        req.scheduled_start = `${SCHEDULE_DATE}T01:00:00`;
        req.scheduled_end = `${SCHEDULE_DATE}T02:30:00`;
      }
    }
    if (suggestion.type === "bundle" || suggestion.type === "split") {
      req.scheduled_start = `${SCHEDULE_DATE}T02:00:00`;
      req.scheduled_end = `${SCHEDULE_DATE}T03:00:00`;
      req.assigned_crew_id = 2;
    }
  }
}

export async function whatIf(input: WhatIfInput): Promise<WhatIfResult> {
  await delay(800);
  const base = requests.filter((r) => r.status !== "deferred").map((r) => ({ ...r }));

  const before = runScheduler(base, crews, defaultEquipPool(), input.date);

  const extraCrews: Crew[] = Array.from({ length: input.add_crews }, (_, i) => ({
    id: 100 + i,
    name: `Extra Signalling Engineer ${i + 1}`,
    skills: ["signalling", "electrical"],
    available_start: "00:00",
    available_end: "04:00",
    max_concurrent_jobs: 1,
  }));
  const extend = (t: string, add: number) => {
    const m = timeToMinutes(t) + add;
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  };
  const crewPool = [...crews, ...extraCrews].map((c) => ({
    ...c,
    available_end: extend(c.available_end, input.extra_window_minutes),
  }));
  const after = runScheduler(clone(base), crewPool, defaultEquipPool(input.add_equipment), input.date);

  const beforeTotal = before.results.filter((r) => r.status !== "scheduled").length;
  const afterTotal = after.results.filter((r) => r.status !== "scheduled").length;
  const cleared = beforeTotal - afterTotal;
  const parts: string[] = [];
  if (input.add_crews > 0) parts.push(`${input.add_crews} signalling engineer${input.add_crews > 1 ? "s" : ""}`);
  if (input.add_equipment.length > 0) parts.push(input.add_equipment.join(", ").replaceAll("_", " "));
  if (input.extra_window_minutes > 0) parts.push(`${input.extra_window_minutes} min longer window`);
  const impact =
    cleared > 0
      ? `Adding ${parts.join(" + ")} clears ${cleared} job${cleared > 1 ? "s" : ""} — deferred drops from ${beforeTotal} to ${afterTotal}.`
      : `Adding ${parts.join(" + ") || "resources"} does not clear additional jobs — the binding constraint is ${after.bottleneck.toLowerCase()}.`;

  return {
    before: { scheduled: before.scheduled, deferred: beforeTotal, bottleneck: before.bottleneck },
    after: { scheduled: after.scheduled, deferred: afterTotal, bottleneck: after.bottleneck },
    impact,
  };
}

export async function getDashboard(): Promise<DashboardStats> {
  await delay();
  const count = (s: RequestStatus) => requests.filter((r) => r.status === s).length;
  const avgTrust = Math.round(requests.reduce((a, r) => a + r.trust_score, 0) / requests.length);
  const topDeferred = requests
    .filter((r) => r.status === "deferred" || r.status === "in_conflict")
    .sort((a, b) => b.final_priority - a.final_priority)
    .slice(0, 5);
  return {
    total_requests: requests.length,
    scheduled: count("scheduled"),
    deferred: count("deferred"),
    in_conflict: count("in_conflict"),
    pending: count("pending"),
    bottleneck: lastRun?.bottleneck ?? "Not yet optimised",
    bottleneck_breakdown: lastRun?.bottleneck_breakdown ?? { crew: 0, equipment: 0, sector: 0, time: 0 },
    avg_trust_score: avgTrust,
    top_deferred: clone(topDeferred),
  };
}

export async function listCrews(): Promise<Crew[]> {
  await delay(150);
  return clone(crews);
}
