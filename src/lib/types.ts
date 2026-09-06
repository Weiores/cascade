export type RequestType = "planned" | "routine" | "manual" | "predictive";
export type RequestStatus = "pending" | "scheduled" | "deferred" | "in_conflict";

export interface MaintenanceRequest {
  id: number;
  title: string;
  type: RequestType;
  location: string;
  duration_minutes: number;
  deadline: string;
  priority_score: number;
  trust_score: number;
  final_priority: number;
  required_skills: string[];
  required_equipment: string[];
  manpower_count: number;
  work_compatibility_tags: string[];
  status: RequestStatus;
  scheduled_start: string | null;
  scheduled_end: string | null;
  assigned_crew_id: number | null;
  conflict_reason: string | null;
}

export interface Crew {
  id: number;
  name: string;
  skills: string[];
  available_start: string;
  available_end: string;
  max_concurrent_jobs: number;
}

export interface Equipment {
  id: number;
  name: string;
  type: string;
  available: boolean;
}

export interface Sector {
  id: number;
  name: string;
  exclusion_zone: string[];
}

export interface ScheduleRun {
  id: number;
  date: string;
  total_jobs: number;
  scheduled_jobs: number;
  deferred_jobs: number;
  utilisation_rate: number;
  primary_bottleneck: string;
}

export interface BottleneckBreakdown {
  crew: number;
  equipment: number;
  sector: number;
  time: number;
}

export interface OptimiseResult {
  schedule: MaintenanceRequest[];
  conflicts: MaintenanceRequest[];
  deferred: MaintenanceRequest[];
  bottleneck: string;
  bottleneck_breakdown: BottleneckBreakdown;
  utilisation_rate: number;
}

export type ConflictSuggestion =
  | { type: "change_time"; description: string; new_start: string; new_end: string }
  | { type: "change_crew"; description: string; new_crew_id: number }
  | { type: "bundle"; description: string; bundle_with_id: number }
  | { type: "defer"; description: string; defer_to_date: string }
  | { type: "split"; description: string };

export interface ScheduleForDate {
  date: string;
  schedule: MaintenanceRequest[];
  conflicts: MaintenanceRequest[];
  deferred: MaintenanceRequest[];
  bottleneck: string | null;
  bottleneck_breakdown: BottleneckBreakdown | null;
  utilisation_rate: number | null;
  crews: Crew[];
}

export interface WhatIfInput {
  add_crews: number;
  add_equipment: string[];
  extra_window_minutes: number;
  date: string;
}

export interface WhatIfResult {
  before: { scheduled: number; deferred: number; bottleneck: string };
  after: { scheduled: number; deferred: number; bottleneck: string };
  impact: string;
}

export interface DashboardStats {
  total_requests: number;
  scheduled: number;
  deferred: number;
  in_conflict: number;
  pending: number;
  bottleneck: string;
  bottleneck_breakdown: BottleneckBreakdown;
  avg_trust_score: number;
  top_deferred: MaintenanceRequest[];
}

export interface NewRequestInput {
  title: string;
  type: RequestType;
  location: string;
  duration_minutes: number;
  deadline: string;
  priority_score: number;
  required_skills: string[];
  required_equipment: string[];
  manpower_count: number;
  work_compatibility_tags: string[];
}
