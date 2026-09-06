import { Router } from "express";
import { getRequests } from "../db/queries";
import { getLastRun } from "../db/queries";

const router = Router();

router.get("/", (_req, res) => {
  const requests = getRequests();
  const lastRun = getLastRun("2026-09-01");

  const count = (s: string) => requests.filter((r) => r.status === s).length;
  const avgTrust =
    requests.length > 0
      ? Math.round(requests.reduce((a, r) => a + r.trust_score, 0) / requests.length)
      : 0;

  const topDeferred = requests
    .filter((r) => r.status === "deferred" || r.status === "in_conflict")
    .sort((a, b) => b.final_priority - a.final_priority)
    .slice(0, 5);

  res.json({
    total_requests: requests.length,
    scheduled: count("scheduled"),
    deferred: count("deferred"),
    in_conflict: count("in_conflict"),
    pending: count("pending"),
    bottleneck: lastRun?.bottleneck ?? "Not yet optimised",
    bottleneck_breakdown: lastRun ? JSON.parse(lastRun.bottleneck_breakdown) : { crew: 0, equipment: 0, sector: 0, time: 0 },
    avg_trust_score: avgTrust,
    top_deferred: topDeferred,
  });
});

export default router;
