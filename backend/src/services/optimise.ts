import type { BottleneckBreakdown, Crew, Equipment, MaintenanceRequest, Sector } from "../types";
import { buildEquipPool, detectConflict, overlaps, PlacedJob } from "./assess";

export interface RunOutcome {
  results: MaintenanceRequest[];
  scheduled: number;
  deferred: number;
  breakdown: BottleneckBreakdown;
  bottleneck: string;
  utilisation_rate: number;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToISO(date: string, minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

function bottleneckLabel(breakdown: BottleneckBreakdown): string {
  const labels: Record<keyof BottleneckBreakdown, string> = {
    crew: "Crew availability",
    equipment: "Equipment",
    sector: "Sector access",
    time: "Engineering window",
  };
  const entries = Object.entries(breakdown) as [keyof BottleneckBreakdown, number][];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][1] > 0 ? labels[entries[0][0]] : "None";
}

export function runScheduler(
  requests: MaintenanceRequest[],
  crews: Crew[],
  equipment: Equipment[],
  sectors: Sector[],
  date: string,
  extraEquipment: string[] = []
): RunOutcome {
  const equipPool = buildEquipPool(equipment, extraEquipment);
  const placed: PlacedJob[] = [];
  const breakdown: BottleneckBreakdown = { crew: 0, equipment: 0, sector: 0, time: 0 };
  const results: MaintenanceRequest[] = [];

  const sorted = [...requests].sort((a, b) => b.final_priority - a.final_priority);

  for (const req of sorted) {
    const out: MaintenanceRequest = {
      ...req,
      status: "pending",
      scheduled_start: null,
      scheduled_end: null,
      assigned_crew_id: null,
      conflict_reason: null,
    };

    const deadlineMin =
      (Date.parse(req.deadline) - Date.parse(`${date}T00:00:00`)) / 60000;

    const eligibleCrews = crews.filter((c) =>
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

        const conflict = detectConflict(
          { location: req.location, start: t, end, crewId: crew.id, required_equipment: req.required_equipment, work_tags: req.work_compatibility_tags },
          placed,
          sectors,
          equipPool
        );

        if (conflict) {
          if (!bestReason) bestReason = conflict;
          continue;
        }

        placed.push({ id: req.id, location: req.location, start: t, end, crewId: crew.id, required_equipment: req.required_equipment, work_tags: req.work_compatibility_tags });
        out.status = "scheduled";
        out.scheduled_start = minutesToISO(date, t);
        out.scheduled_end = minutesToISO(date, end);
        out.assigned_crew_id = crew.id;
        assigned = true;
        break outer;
      }
    }

    if (!assigned) {
      const reason = bestReason ?? { reason: "No available slot in engineering window", kind: "time" as const };
      const isCapacityOnly =
        reason.reason === "Cannot finish before deadline" || reason.kind === "time";
      out.status = isCapacityOnly ? "deferred" : "in_conflict";
      out.conflict_reason = reason.reason;
      breakdown[reason.kind]++;
    }

    results.push(out);
  }

  const scheduledMin = placed.reduce((a, p) => a + (p.end - p.start), 0);
  const crewMin = crews.reduce(
    (a, c) =>
      a + (timeToMinutes(c.available_end) - timeToMinutes(c.available_start)) * c.max_concurrent_jobs,
    0
  );

  return {
    results,
    scheduled: results.filter((r) => r.status === "scheduled").length,
    deferred: results.filter((r) => r.status !== "scheduled").length,
    breakdown,
    bottleneck: bottleneckLabel(breakdown),
    utilisation_rate: crewMin > 0 ? Math.round((scheduledMin / crewMin) * 100) : 0,
  };
}
