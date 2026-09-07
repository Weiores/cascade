import { Router } from "express";
import { getRequests, getEquipment, getSectors, getCrews, updateManyRequests, insertScheduleRun } from "../db/queries";
import { runScheduler } from "../services/optimise";
import { optimiseBodySchema, parseInput, whatIfSchema } from "../validation";

const router = Router();

router.post("/optimise", (req, res) => {
  const input = parseInput(optimiseBodySchema, req.body ?? {}, res);
  if (!input) return;
  const date = input.date || "2026-09-01";
  const requests = getRequests().filter((r) => r.status !== "deferred");
  const crews = getCrews();
  const equipment = getEquipment();
  const sectors = getSectors();

  const outcome = runScheduler(requests, crews, equipment, sectors, date);

  updateManyRequests(outcome.results.map((r) => ({ id: r.id, fields: {
    status: r.status,
    scheduled_start: r.scheduled_start,
    scheduled_end: r.scheduled_end,
    assigned_crew_id: r.assigned_crew_id,
    conflict_reason: r.conflict_reason,
  }})));

  insertScheduleRun(date, outcome.bottleneck, outcome.breakdown, outcome.utilisation_rate);

  res.json({
    schedule: outcome.results.filter((r) => r.status === "scheduled"),
    conflicts: outcome.results.filter((r) => r.status === "in_conflict"),
    deferred: outcome.results.filter((r) => r.status === "deferred"),
    bottleneck: outcome.bottleneck,
    bottleneck_breakdown: outcome.breakdown,
    utilisation_rate: outcome.utilisation_rate,
  });
});

router.post("/what-if", (req, res) => {
  const input = parseInput(whatIfSchema, req.body ?? {}, res);
  if (!input) return;
  const requests = getRequests().filter((r) => r.status !== "deferred");
  const crews = getCrews();
  const equipment = getEquipment();
  const sectors = getSectors();

  const baseline = runScheduler(requests, crews, equipment, sectors, input.date);

  function extendWindow(t: string, addMin: number): string {
    const [h, m] = t.split(":").map(Number);
    const total = h * 60 + m + addMin;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }

  const extraCrews = Array.from({ length: input.add_crews }, (_, i) => ({
    id: 100 + i,
    name: `Extra Signalling Engineer ${i + 1}`,
    skills: ["signalling", "electrical"],
    available_start: "00:00",
    available_end: extendWindow("04:00", input.extra_window_minutes),
    max_concurrent_jobs: 1,
  }));

  const augCrews = [...crews, ...extraCrews].map((c) => ({
    ...c,
    available_end: extendWindow(c.available_end, input.extra_window_minutes),
  }));

  const augmented = runScheduler(
    requests.map((r) => ({ ...r })),
    augCrews,
    equipment,
    sectors,
    input.date,
    input.add_equipment
  );

  const beforeUnplaced = baseline.deferred;
  const afterUnplaced = augmented.deferred;
  const cleared = beforeUnplaced - afterUnplaced;

  const parts: string[] = [];
  if (input.add_crews > 0) parts.push(`${input.add_crews} signalling engineer${input.add_crews > 1 ? "s" : ""}`);
  if (input.add_equipment.length > 0) parts.push(input.add_equipment.join(", ").replaceAll("_", " "));
  if (input.extra_window_minutes > 0) parts.push(`${input.extra_window_minutes} min longer window`);

  const impact =
    cleared > 0
      ? `Adding ${parts.join(" + ")} clears ${cleared} job${cleared > 1 ? "s" : ""} — deferred drops from ${beforeUnplaced} to ${afterUnplaced}.`
      : `Adding ${parts.join(" + ") || "resources"} does not clear additional jobs — the binding constraint is ${augmented.bottleneck.toLowerCase()}.`;

  res.json({
    before: { scheduled: baseline.scheduled, deferred: beforeUnplaced, bottleneck: baseline.bottleneck },
    after: { scheduled: augmented.scheduled, deferred: afterUnplaced, bottleneck: augmented.bottleneck },
    impact,
  });
});

export default router;
