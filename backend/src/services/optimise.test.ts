import { describe, expect, it } from "vitest";
import { runScheduler } from "./optimise";
import type { Crew, Equipment, MaintenanceRequest, Sector } from "../types";

const date = "2026-09-01";

function request(overrides: Partial<MaintenanceRequest>): MaintenanceRequest {
  return {
    id: 1,
    title: "Test job",
    type: "planned",
    location: "Track 1",
    duration_minutes: 60,
    deadline: `${date}T06:00:00`,
    priority_score: 80,
    trust_score: 95,
    final_priority: 86,
    required_skills: ["track"],
    required_equipment: [],
    manpower_count: 1,
    work_compatibility_tags: ["mechanical"],
    status: "pending",
    scheduled_start: null,
    scheduled_end: null,
    assigned_crew_id: null,
    conflict_reason: null,
    ...overrides,
  };
}

const crews: Crew[] = [
  { id: 1, name: "Track Crew", skills: ["track"], available_start: "00:00", available_end: "02:00", max_concurrent_jobs: 1 },
  { id: 2, name: "Signal Crew", skills: ["signalling"], available_start: "00:00", available_end: "02:00", max_concurrent_jobs: 1 },
];

const equipment: Equipment[] = [
  { id: 1, name: "work_train", type: "vehicle", available: true },
  { id: 2, name: "rail_grinder", type: "vehicle", available: false },
];

const sectors: Sector[] = [
  { id: 1, name: "Track 1", exclusion_zone: ["Track 2"] },
  { id: 2, name: "Track 2", exclusion_zone: [] },
];

describe("runScheduler", () => {
  it("schedules feasible jobs in priority order", () => {
    const outcome = runScheduler([
      request({ id: 1, title: "Lower priority", final_priority: 60 }),
      request({ id: 2, title: "Higher priority", final_priority: 90 }),
    ], crews, equipment, sectors, date);

    const high = outcome.results.find((r) => r.id === 2)!;
    const low = outcome.results.find((r) => r.id === 1)!;

    expect(high.status).toBe("scheduled");
    expect(high.scheduled_start).toBe(`${date}T00:00:00`);
    expect(high.assigned_crew_id).toBe(1);
    expect(low.status).toBe("scheduled");
    expect(low.scheduled_start).toBe(`${date}T01:00:00`);
    expect(outcome.utilisation_rate).toBe(50);
  });

  it("defers jobs when no crew has the required skills", () => {
    const outcome = runScheduler([
      request({ required_skills: ["welding"] }),
    ], crews, equipment, sectors, date);

    expect(outcome.results[0].status).toBe("deferred");
    expect(outcome.results[0].conflict_reason).toBe("No crew with required skills");
    expect(outcome.breakdown.crew).toBe(1);
    expect(outcome.bottleneck).toBe("Crew availability");
  });

  it("defers jobs when required equipment is unavailable", () => {
    const outcome = runScheduler([
      request({ required_equipment: ["rail_grinder"] }),
    ], crews, equipment, sectors, date);

    expect(outcome.results[0].status).toBe("deferred");
    expect(outcome.results[0].conflict_reason).toBe("Equipment unavailable");
    expect(outcome.breakdown.equipment).toBe(1);
    expect(outcome.bottleneck).toBe("Equipment");
  });

  it("marks overlapping exclusion-zone work as a conflict", () => {
    const oneHourCrew = [{ ...crews[0], available_end: "01:00", max_concurrent_jobs: 2 }];
    const outcome = runScheduler([
      request({ id: 1, location: "Track 1", final_priority: 90 }),
      request({ id: 2, location: "Track 2", final_priority: 80 }),
    ], oneHourCrew, equipment, sectors, date);

    expect(outcome.results.find((r) => r.id === 2)?.status).toBe("in_conflict");
    expect(outcome.results.find((r) => r.id === 2)?.conflict_reason).toBe("Adjacent sector exclusion");
    expect(outcome.breakdown.sector).toBe(1);
  });

  it("uses extra equipment to avoid equipment contention", () => {
    const requests = [
      request({ id: 1, final_priority: 90, required_skills: ["track"], required_equipment: ["work_train"] }),
      request({ id: 2, final_priority: 80, required_skills: ["welding"], required_equipment: ["work_train"], location: "Depot" }),
    ];
    const parallelCrews = [
      { ...crews[0], available_end: "01:00", max_concurrent_jobs: 1 },
      { id: 3, name: "Welding Crew", skills: ["welding"], available_start: "00:00", available_end: "01:00", max_concurrent_jobs: 1 },
    ];

    const baseline = runScheduler(requests, parallelCrews, equipment, sectors, date);
    const augmented = runScheduler(requests, parallelCrews, equipment, sectors, date, ["work_train"]);

    expect(baseline.results.find((r) => r.id === 2)?.status).toBe("in_conflict");
    expect(baseline.results.find((r) => r.id === 2)?.conflict_reason).toBe("Equipment conflict");
    expect(augmented.results.filter((r) => r.status === "scheduled")).toHaveLength(2);
  });
});
