import db from "./index";
import type { Crew, Equipment, MaintenanceRequest, RequestStatus, Sector } from "../types";

// ---------- row mappers ----------
function rowToRequest(row: Record<string, unknown>): MaintenanceRequest {
  return {
    id: row.id as number,
    title: row.title as string,
    type: row.type as MaintenanceRequest["type"],
    location: row.location as string,
    duration_minutes: row.duration_minutes as number,
    deadline: row.deadline as string,
    priority_score: row.priority_score as number,
    trust_score: row.trust_score as number,
    final_priority: row.final_priority as number,
    required_skills: JSON.parse(row.required_skills as string),
    required_equipment: JSON.parse(row.required_equipment as string),
    manpower_count: row.manpower_count as number,
    work_compatibility_tags: JSON.parse(row.work_compatibility_tags as string),
    status: row.status as RequestStatus,
    scheduled_start: (row.scheduled_start as string | null) ?? null,
    scheduled_end: (row.scheduled_end as string | null) ?? null,
    assigned_crew_id: (row.assigned_crew_id as number | null) ?? null,
    conflict_reason: (row.conflict_reason as string | null) ?? null,
  };
}

function rowToCrew(row: Record<string, unknown>): Crew {
  return {
    id: row.id as number,
    name: row.name as string,
    skills: JSON.parse(row.skills as string),
    available_start: row.available_start as string,
    available_end: row.available_end as string,
    max_concurrent_jobs: row.max_concurrent_jobs as number,
  };
}

function rowToEquipment(row: Record<string, unknown>): Equipment {
  return {
    id: row.id as number,
    name: row.name as string,
    type: row.type as string,
    available: (row.available as number) === 1,
  };
}

function rowToSector(row: Record<string, unknown>): Sector {
  return {
    id: row.id as number,
    name: row.name as string,
    exclusion_zone: JSON.parse(row.exclusion_zone as string),
  };
}

// ---------- requests ----------
export function getRequests(status?: RequestStatus): MaintenanceRequest[] {
  const rows = status
    ? db.prepare("SELECT * FROM requests WHERE status = ? ORDER BY final_priority DESC").all(status)
    : db.prepare("SELECT * FROM requests ORDER BY final_priority DESC").all();
  return (rows as Record<string, unknown>[]).map(rowToRequest);
}

export function getRequestById(id: number): MaintenanceRequest | null {
  const row = db.prepare("SELECT * FROM requests WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? rowToRequest(row) : null;
}

export function insertRequest(req: Omit<MaintenanceRequest, "id">): MaintenanceRequest {
  const stmt = db.prepare(`
    INSERT INTO requests (title, type, location, duration_minutes, deadline, priority_score,
      trust_score, final_priority, required_skills, required_equipment, manpower_count,
      work_compatibility_tags, status, scheduled_start, scheduled_end, assigned_crew_id, conflict_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    req.title, req.type, req.location, req.duration_minutes, req.deadline,
    req.priority_score, req.trust_score, req.final_priority,
    JSON.stringify(req.required_skills), JSON.stringify(req.required_equipment),
    req.manpower_count, JSON.stringify(req.work_compatibility_tags),
    req.status, req.scheduled_start ?? null, req.scheduled_end ?? null,
    req.assigned_crew_id ?? null, req.conflict_reason ?? null
  );
  return getRequestById(info.lastInsertRowid as number)!;
}

export function updateRequest(id: number, fields: Partial<MaintenanceRequest>): void {
  const entries = Object.entries(fields);
  if (entries.length === 0) return;

  const setClauses = entries.map(([k]) => `${k} = ?`).join(", ");
  const values: Array<string | number | null> = entries.map(([k, v]) => {
    if (k === "required_skills" || k === "required_equipment" || k === "work_compatibility_tags") {
      return JSON.stringify(v);
    }
    if (v === undefined) return null;
    return v as string | number | null;
  });

  db.prepare(`UPDATE requests SET ${setClauses} WHERE id = ?`).run(...values, id);
}

export function updateManyRequests(updates: Array<{ id: number; fields: Partial<MaintenanceRequest> }>): void {
  const stmt = db.prepare(`UPDATE requests SET status = ?, scheduled_start = ?, scheduled_end = ?, assigned_crew_id = ?, conflict_reason = ? WHERE id = ?`);
  db.exec("BEGIN TRANSACTION");
  try {
    for (const { id, fields } of updates) {
      stmt.run(
        fields.status ?? null,
        fields.scheduled_start ?? null,
        fields.scheduled_end ?? null,
        fields.assigned_crew_id ?? null,
        fields.conflict_reason ?? null,
        id
      );
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

// ---------- crews ----------
export function getCrews(): Crew[] {
  return (db.prepare("SELECT * FROM crews").all() as Record<string, unknown>[]).map(rowToCrew);
}

export function getCrewById(id: number): Crew | null {
  const row = db.prepare("SELECT * FROM crews WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? rowToCrew(row) : null;
}

export function insertCrew(data: Omit<Crew, "id">): Crew {
  const info = db.prepare(
    "INSERT INTO crews (name, skills, available_start, available_end, max_concurrent_jobs) VALUES (?, ?, ?, ?, ?)"
  ).run(data.name, JSON.stringify(data.skills), data.available_start, data.available_end, data.max_concurrent_jobs);
  return getCrewById(info.lastInsertRowid as number)!;
}

export function updateCrew(id: number, fields: Partial<Omit<Crew, "id">>): Crew | null {
  const entries = Object.entries(fields);
  if (entries.length === 0) return getCrewById(id);
  const setClauses = entries.map(([k]) => `${k} = ?`).join(", ");
  const values: Array<string | number | null> = entries.map(([k, v]) =>
    k === "skills" ? JSON.stringify(v) : (v as string | number | null)
  );
  db.prepare(`UPDATE crews SET ${setClauses} WHERE id = ?`).run(...values, id);
  return getCrewById(id);
}

export function deleteCrew(id: number): void {
  db.prepare("DELETE FROM crews WHERE id = ?").run(id);
}

// ---------- equipment ----------
export function getEquipment(): Equipment[] {
  return (db.prepare("SELECT * FROM equipment").all() as Record<string, unknown>[]).map(rowToEquipment);
}

export function getEquipmentById(id: number): Equipment | null {
  const row = db.prepare("SELECT * FROM equipment WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? rowToEquipment(row) : null;
}

export function insertEquipment(data: Omit<Equipment, "id">): Equipment {
  const info = db.prepare(
    "INSERT INTO equipment (name, type, available) VALUES (?, ?, ?)"
  ).run(data.name, data.type, data.available ? 1 : 0);
  return getEquipmentById(info.lastInsertRowid as number)!;
}

export function updateEquipment(id: number, fields: Partial<Omit<Equipment, "id">>): Equipment | null {
  const entries = Object.entries(fields);
  if (entries.length === 0) return getEquipmentById(id);
  const setClauses = entries.map(([k]) => `${k} = ?`).join(", ");
  const values: Array<string | number | null> = entries.map(([k, v]) =>
    k === "available" ? (v ? 1 : 0) : (v as string | number | null)
  );
  db.prepare(`UPDATE equipment SET ${setClauses} WHERE id = ?`).run(...values, id);
  return getEquipmentById(id);
}

export function deleteEquipment(id: number): void {
  db.prepare("DELETE FROM equipment WHERE id = ?").run(id);
}

// ---------- sectors ----------
export function getSectors(): Sector[] {
  return (db.prepare("SELECT * FROM sectors").all() as Record<string, unknown>[]).map(rowToSector);
}

export function getSectorById(id: number): Sector | null {
  const row = db.prepare("SELECT * FROM sectors WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? rowToSector(row) : null;
}

export function insertSector(data: Omit<Sector, "id">): Sector {
  const info = db.prepare(
    "INSERT INTO sectors (name, exclusion_zone) VALUES (?, ?)"
  ).run(data.name, JSON.stringify(data.exclusion_zone));
  return getSectorById(info.lastInsertRowid as number)!;
}

export function updateSector(id: number, fields: Partial<Omit<Sector, "id">>): Sector | null {
  const entries = Object.entries(fields);
  if (entries.length === 0) return getSectorById(id);
  const setClauses = entries.map(([k]) => `${k} = ?`).join(", ");
  const values: Array<string | null> = entries.map(([k, v]) =>
    k === "exclusion_zone" ? JSON.stringify(v) : (v as string | null)
  );
  db.prepare(`UPDATE sectors SET ${setClauses} WHERE id = ?`).run(...values, id);
  return getSectorById(id);
}

export function deleteSector(id: number): void {
  db.prepare("DELETE FROM sectors WHERE id = ?").run(id);
}

// ---------- schedule runs ----------
export interface ScheduleRunRow {
  bottleneck: string;
  bottleneck_breakdown: string;
  utilisation_rate: number;
}

export function getLastRun(date: string): ScheduleRunRow | null {
  return (db.prepare("SELECT * FROM schedule_runs WHERE date = ? ORDER BY id DESC LIMIT 1").get(date) as ScheduleRunRow | undefined) ?? null;
}

export function insertScheduleRun(date: string, bottleneck: string, breakdown: object, utilisation: number): void {
  db.prepare("INSERT INTO schedule_runs (date, bottleneck, bottleneck_breakdown, utilisation_rate) VALUES (?, ?, ?, ?)")
    .run(date, bottleneck, JSON.stringify(breakdown), utilisation);
}
