import type {
  ConflictSuggestion,
  Crew,
  DashboardStats,
  Equipment,
  MaintenanceRequest,
  NewRequestInput,
  OptimiseResult,
  RequestStatus,
  RequestType,
  ScheduleForDate,
  Sector,
  WhatIfInput,
  WhatIfResult,
} from "./types";

// These two stay on the frontend for the live trust-preview panel in RequestIntake
export function computeTrustScore(title: string, type: RequestType): number {
  if (type !== "predictive") {
    return type === "planned" ? 95 : type === "routine" ? 90 : 75;
  }
  let score = 70;
  if (/single sensor/i.test(title)) score -= 20;
  if (/anomaly|unusual/i.test(title)) score -= 15;
  return Math.max(10, Math.min(100, score));
}

export function computeFinalPriority(priority: number, trust: number): number {
  return Math.round(priority * 0.6 + trust * 0.4);
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return res.json();
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} → ${res.status}`);
  return res.json();
}

async function del(path: string): Promise<void> {
  const res = await fetch(path, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(`DELETE ${path} → ${res.status}`);
}

export async function listRequests(status?: RequestStatus): Promise<MaintenanceRequest[]> {
  const url = status ? `/api/requests?status=${status}` : "/api/requests";
  return get<MaintenanceRequest[]>(url);
}

export async function createRequest(input: NewRequestInput): Promise<MaintenanceRequest> {
  return post<MaintenanceRequest>("/api/requests", input);
}

export async function optimise(date: string): Promise<OptimiseResult> {
  return post<OptimiseResult>("/api/optimise", { date });
}

export async function getSchedule(date: string): Promise<ScheduleForDate> {
  return get<ScheduleForDate>(`/api/schedule?date=${date}`);
}

export async function getConflictSuggestions(id: number): Promise<ConflictSuggestion[]> {
  return get<ConflictSuggestion[]>(`/api/requests/${id}/suggestions`);
}

export async function applySuggestion(id: number, suggestion: ConflictSuggestion): Promise<void> {
  await post(`/api/requests/${id}/apply-suggestion`, suggestion);
}

export async function whatIf(input: WhatIfInput): Promise<WhatIfResult> {
  return post<WhatIfResult>("/api/what-if", input);
}

export async function getDashboard(): Promise<DashboardStats> {
  return get<DashboardStats>("/api/dashboard");
}

// ---------- crews ----------
export async function listCrews(): Promise<Crew[]> {
  return get<Crew[]>("/api/crews");
}

export async function createCrew(input: Omit<Crew, "id">): Promise<Crew> {
  return post<Crew>("/api/crews", input);
}

export async function updateCrew(id: number, fields: Partial<Omit<Crew, "id">>): Promise<Crew> {
  return patch<Crew>(`/api/crews/${id}`, fields);
}

export async function deleteCrew(id: number): Promise<void> {
  return del(`/api/crews/${id}`);
}

// ---------- equipment ----------
export async function listEquipment(): Promise<Equipment[]> {
  return get<Equipment[]>("/api/equipment");
}

export async function createEquipment(input: Omit<Equipment, "id">): Promise<Equipment> {
  return post<Equipment>("/api/equipment", input);
}

export async function updateEquipment(id: number, fields: Partial<Omit<Equipment, "id">>): Promise<Equipment> {
  return patch<Equipment>(`/api/equipment/${id}`, fields);
}

export async function deleteEquipment(id: number): Promise<void> {
  return del(`/api/equipment/${id}`);
}

// ---------- sectors ----------
export async function listSectors(): Promise<Sector[]> {
  return get<Sector[]>("/api/sectors");
}

export async function createSector(input: Omit<Sector, "id">): Promise<Sector> {
  return post<Sector>("/api/sectors", input);
}

export async function updateSector(id: number, fields: Partial<Omit<Sector, "id">>): Promise<Sector> {
  return patch<Sector>(`/api/sectors/${id}`, fields);
}

export async function deleteSector(id: number): Promise<void> {
  return del(`/api/sectors/${id}`);
}
