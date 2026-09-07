import { Router } from "express";
import { getRequests, getLastRun, getCrews } from "../db/queries";
import { parseInput, scheduleQuerySchema } from "../validation";

const router = Router();

router.get("/", (req, res) => {
  const query = parseInput(scheduleQuerySchema, req.query, res);
  if (!query) return;
  const date = query.date || "2026-09-01";
  const requests = getRequests();
  const lastRun = getLastRun(date);

  res.json({
    date,
    schedule: requests.filter((r) => r.status === "scheduled"),
    conflicts: requests.filter((r) => r.status === "in_conflict"),
    deferred: requests.filter((r) => r.status === "deferred"),
    bottleneck: lastRun?.bottleneck ?? null,
    bottleneck_breakdown: lastRun ? JSON.parse(lastRun.bottleneck_breakdown) : null,
    utilisation_rate: lastRun?.utilisation_rate ?? null,
    crews: getCrews(),
  });
});

export default router;
