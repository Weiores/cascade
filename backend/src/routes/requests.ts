import { Router } from "express";
import { getRequests, getRequestById, insertRequest, updateRequest, getCrews } from "../db/queries";
import { computeTrustScore, computeFinalPriority } from "../services/prioritise";
import type { ConflictSuggestion, NewRequestInput } from "../types";

const router = Router();

router.get("/", (req, res) => {
  const status = req.query.status as string | undefined;
  const valid = ["pending", "scheduled", "deferred", "in_conflict"];
  const requests = getRequests(valid.includes(status ?? "") ? (status as any) : undefined);
  res.json(requests);
});

router.post("/", (req, res) => {
  const input: NewRequestInput = req.body;
  const trust = computeTrustScore(input.title, input.type);
  const final = computeFinalPriority(input.priority_score, trust);

  const created = insertRequest({
    ...input,
    trust_score: trust,
    final_priority: final,
    status: "pending",
    scheduled_start: null,
    scheduled_end: null,
    assigned_crew_id: null,
    conflict_reason: null,
  });

  res.status(201).json(created);
});

router.get("/:id/suggestions", (req, res) => {
  const id = Number(req.params.id);
  const req_ = getRequestById(id);
  if (!req_) return res.status(404).json({ error: "Not found" });

  const scheduled = getRequests("scheduled");
  const crews = getCrews();
  const SCHEDULE_DATE = "2026-09-01";
  const suggestions: ConflictSuggestion[] = [];

  function timeToMinutes(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }
  function isoToTime(iso: string): string {
    return iso.split("T")[1]?.substring(0, 5) ?? "00:00";
  }
  function fmt(m: number): string {
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  }

  const sameLoc = scheduled.find((r) => r.location === req_.location);
  if (sameLoc?.scheduled_end) {
    const endMin = timeToMinutes(isoToTime(sameLoc.scheduled_end));
    const newEnd = endMin + req_.duration_minutes;
    if (newEnd <= 360) {
      suggestions.push({
        type: "change_time",
        description: `Move to ${fmt(endMin)}–${fmt(newEnd)}, right after Job #${sameLoc.id} clears ${req_.location}`,
        new_start: `${SCHEDULE_DATE}T${fmt(endMin)}:00`,
        new_end: `${SCHEDULE_DATE}T${fmt(newEnd)}:00`,
      });
    }
  }

  const otherCrew = crews.find(
    (c) => c.id !== req_.assigned_crew_id && req_.required_skills.every((s) => c.skills.includes(s))
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
      description: `Bundle with Job #${sameLoc.id} at ${req_.location} — share track access and one possession`,
      bundle_with_id: sameLoc.id,
    });
  }

  if (req_.duration_minutes > 60) {
    suggestions.push({
      type: "split",
      description: `Split into 2 sessions of ${Math.round(req_.duration_minutes / 2)} min across consecutive nights`,
    });
  }

  suggestions.push({
    type: "defer",
    description: "Defer to next available night (2026-09-02), priority carried over",
    defer_to_date: "2026-09-02",
  });

  res.json(suggestions.slice(0, 4));
});

router.post("/:id/apply-suggestion", (req, res) => {
  const id = Number(req.params.id);
  const req_ = getRequestById(id);
  if (!req_) return res.status(404).json({ error: "Not found" });

  const suggestion: ConflictSuggestion = req.body;
  const SCHEDULE_DATE = "2026-09-01";

  if (suggestion.type === "defer") {
    updateRequest(id, { status: "deferred", conflict_reason: null });
  } else {
    const fields: Partial<typeof req_> = { status: "scheduled", conflict_reason: null };
    if (suggestion.type === "change_time") {
      fields.scheduled_start = suggestion.new_start;
      fields.scheduled_end = suggestion.new_end;
      fields.assigned_crew_id = req_.assigned_crew_id ?? 1;
    } else if (suggestion.type === "change_crew") {
      fields.assigned_crew_id = suggestion.new_crew_id;
      if (!req_.scheduled_start) {
        fields.scheduled_start = `${SCHEDULE_DATE}T01:00:00`;
        fields.scheduled_end = `${SCHEDULE_DATE}T02:30:00`;
      }
    } else if (suggestion.type === "bundle" || suggestion.type === "split") {
      fields.scheduled_start = `${SCHEDULE_DATE}T02:00:00`;
      fields.scheduled_end = `${SCHEDULE_DATE}T03:00:00`;
      fields.assigned_crew_id = 2;
    }
    updateRequest(id, fields);
  }

  res.json({ ok: true });
});

export default router;
