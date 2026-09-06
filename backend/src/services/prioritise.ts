import type { RequestType } from "../types";

export function computeTrustScore(title: string, type: RequestType): number {
  if (type !== "predictive") {
    return type === "planned" ? 95 : type === "routine" ? 90 : 75;
  }
  // Predictive: base 70, penalised for low-confidence signals
  let score = 70;
  if (/single sensor/i.test(title)) score -= 20;
  if (/anomaly|unusual/i.test(title)) score -= 15;
  return Math.max(10, Math.min(100, score));
}

export function computeFinalPriority(priority: number, trust: number): number {
  return Math.round(priority * 0.6 + trust * 0.4);
}
