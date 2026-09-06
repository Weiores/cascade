import db from "./index";
import type { Crew, Equipment, MaintenanceRequest, Sector } from "../types";

const SCHEDULE_DATE = "2026-09-01";
const D = SCHEDULE_DATE;

const seedCrews: Crew[] = [
  { id: 1, name: "Alpha Crew", skills: ["signalling", "electrical"], available_start: "00:00", available_end: "04:00", max_concurrent_jobs: 2 },
  { id: 2, name: "Bravo Crew", skills: ["track", "welding", "mechanical"], available_start: "00:00", available_end: "06:00", max_concurrent_jobs: 1 },
  { id: 3, name: "Charlie Crew", skills: ["signalling", "track"], available_start: "01:00", available_end: "05:00", max_concurrent_jobs: 1 },
];

const seedEquipment: Equipment[] = [
  { id: 1, name: "work_train", type: "vehicle", available: true },
  { id: 2, name: "welding_kit", type: "tool", available: true },
  { id: 3, name: "signal_tester", type: "instrument", available: true },
  { id: 4, name: "rail_grinder", type: "vehicle", available: false },
  { id: 5, name: "lifting_jack", type: "tool", available: true },
];

const seedSectors: Sector[] = [
  { id: 1, name: "Track 12", exclusion_zone: ["Track 14"] },
  { id: 2, name: "Track 14", exclusion_zone: ["Track 12"] },
  { id: 3, name: "Station A", exclusion_zone: ["Track 12"] },
  { id: 4, name: "Depot C", exclusion_zone: [] },
];

const seedRequests: Omit<MaintenanceRequest, never>[] = [
  { id: 1, title: "Point machine replacement at Track 12 crossover", type: "planned", location: "Track 12", duration_minutes: 120, deadline: `${D}T05:00:00`, priority_score: 90, trust_score: 95, final_priority: 92, required_skills: ["signalling"], required_equipment: ["work_train", "lifting_jack"], manpower_count: 4, work_compatibility_tags: ["electrical", "mechanical"], status: "pending", scheduled_start: null, scheduled_end: null, assigned_crew_id: null, conflict_reason: null },
  { id: 2, title: "Anomaly detected: rail vibration on Track 14 (single sensor)", type: "predictive", location: "Track 14", duration_minutes: 90, deadline: `${D}T06:00:00`, priority_score: 85, trust_score: 52, final_priority: 72, required_skills: ["track"], required_equipment: ["signal_tester"], manpower_count: 2, work_compatibility_tags: ["mechanical"], status: "pending", scheduled_start: null, scheduled_end: null, assigned_crew_id: null, conflict_reason: null },
  { id: 3, title: "Unusual current draw on Station A escalator 3 feeder", type: "predictive", location: "Station A", duration_minutes: 60, deadline: `${D}T05:30:00`, priority_score: 70, trust_score: 58, final_priority: 65, required_skills: ["electrical"], required_equipment: ["signal_tester"], manpower_count: 2, work_compatibility_tags: ["electrical"], status: "pending", scheduled_start: null, scheduled_end: null, assigned_crew_id: null, conflict_reason: null },
  { id: 4, title: "Rail grinding pass Track 12 eastbound", type: "routine", location: "Track 12", duration_minutes: 150, deadline: `${D}T06:00:00`, priority_score: 55, trust_score: 90, final_priority: 69, required_skills: ["track"], required_equipment: ["rail_grinder"], manpower_count: 3, work_compatibility_tags: ["mechanical", "hot_work"], status: "pending", scheduled_start: null, scheduled_end: null, assigned_crew_id: null, conflict_reason: null },
  { id: 5, title: "Signal cable insulation test Track 12", type: "routine", location: "Track 12", duration_minutes: 90, deadline: `${D}T05:00:00`, priority_score: 60, trust_score: 90, final_priority: 72, required_skills: ["signalling"], required_equipment: ["signal_tester"], manpower_count: 2, work_compatibility_tags: ["electrical"], status: "pending", scheduled_start: null, scheduled_end: null, assigned_crew_id: null, conflict_reason: null },
  { id: 6, title: "Weld repair on crossing nose, Track 14", type: "manual", location: "Track 14", duration_minutes: 120, deadline: `${D}T06:00:00`, priority_score: 80, trust_score: 75, final_priority: 78, required_skills: ["welding"], required_equipment: ["welding_kit", "work_train"], manpower_count: 3, work_compatibility_tags: ["hot_work"], status: "pending", scheduled_start: null, scheduled_end: null, assigned_crew_id: null, conflict_reason: null },
  { id: 7, title: "3 sensors agree: bearing wear on Depot C hoist", type: "predictive", location: "Depot C", duration_minutes: 75, deadline: `${D}T05:00:00`, priority_score: 65, trust_score: 88, final_priority: 74, required_skills: ["mechanical"], required_equipment: ["lifting_jack"], manpower_count: 2, work_compatibility_tags: ["mechanical"], status: "pending", scheduled_start: null, scheduled_end: null, assigned_crew_id: null, conflict_reason: null },
  { id: 8, title: "Platform screen door alignment, Station A", type: "manual", location: "Station A", duration_minutes: 90, deadline: `${D}T04:30:00`, priority_score: 75, trust_score: 75, final_priority: 75, required_skills: ["mechanical"], required_equipment: ["lifting_jack"], manpower_count: 2, work_compatibility_tags: ["mechanical"], status: "pending", scheduled_start: null, scheduled_end: null, assigned_crew_id: null, conflict_reason: null },
  { id: 9, title: "Track circuit retune, Track 14 to Station A approach", type: "routine", location: "Track 14", duration_minutes: 60, deadline: `${D}T06:00:00`, priority_score: 50, trust_score: 90, final_priority: 66, required_skills: ["signalling"], required_equipment: ["signal_tester"], manpower_count: 2, work_compatibility_tags: ["electrical"], status: "pending", scheduled_start: null, scheduled_end: null, assigned_crew_id: null, conflict_reason: null },
  { id: 10, title: "Overnight patrol: water seepage check near Track 12 sump", type: "routine", location: "Track 12", duration_minutes: 45, deadline: `${D}T06:00:00`, priority_score: 40, trust_score: 90, final_priority: 60, required_skills: ["track"], required_equipment: [], manpower_count: 1, work_compatibility_tags: ["water"], status: "pending", scheduled_start: null, scheduled_end: null, assigned_crew_id: null, conflict_reason: null },
];

export function seedIfEmpty(): void {
  const count = (db.prepare("SELECT COUNT(*) as n FROM requests").get() as { n: number }).n;
  if (count > 0) return;

  const insertReq = db.prepare(`
    INSERT INTO requests (id, title, type, location, duration_minutes, deadline, priority_score,
      trust_score, final_priority, required_skills, required_equipment, manpower_count,
      work_compatibility_tags, status, scheduled_start, scheduled_end, assigned_crew_id, conflict_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCrew = db.prepare(`
    INSERT INTO crews (id, name, skills, available_start, available_end, max_concurrent_jobs)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertEquip = db.prepare(`
    INSERT INTO equipment (id, name, type, available) VALUES (?, ?, ?, ?)
  `);

  const insertSector = db.prepare(`
    INSERT INTO sectors (id, name, exclusion_zone) VALUES (?, ?, ?)
  `);

  db.exec("BEGIN TRANSACTION");
  try {
    for (const r of seedRequests) {
      insertReq.run(
        r.id, r.title, r.type, r.location, r.duration_minutes, r.deadline,
        r.priority_score, r.trust_score, r.final_priority,
        JSON.stringify(r.required_skills), JSON.stringify(r.required_equipment),
        r.manpower_count, JSON.stringify(r.work_compatibility_tags),
        r.status, r.scheduled_start ?? null, r.scheduled_end ?? null,
        r.assigned_crew_id ?? null, r.conflict_reason ?? null
      );
    }
    for (const c of seedCrews) {
      insertCrew.run(c.id, c.name, JSON.stringify(c.skills), c.available_start, c.available_end, c.max_concurrent_jobs);
    }
    for (const e of seedEquipment) {
      insertEquip.run(e.id, e.name, e.type, e.available ? 1 : 0);
    }
    for (const s of seedSectors) {
      insertSector.run(s.id, s.name, JSON.stringify(s.exclusion_zone));
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
  console.log("[seed] Inserted 10 requests, 3 crews, 5 equipment, 4 sectors");
}
