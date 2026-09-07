import { describe, expect, it } from "vitest";
import { computeFinalPriority, computeTrustScore } from "./prioritise";

describe("computeTrustScore", () => {
  it("returns fixed trust scores for non-predictive request types", () => {
    expect(computeTrustScore("planned work", "planned")).toBe(95);
    expect(computeTrustScore("routine work", "routine")).toBe(90);
    expect(computeTrustScore("manual report", "manual")).toBe(75);
  });

  it("applies predictive confidence penalties", () => {
    expect(computeTrustScore("bearing wear", "predictive")).toBe(70);
    expect(computeTrustScore("single sensor bearing wear", "predictive")).toBe(50);
    expect(computeTrustScore("unusual current draw", "predictive")).toBe(55);
    expect(computeTrustScore("anomaly from single sensor", "predictive")).toBe(35);
  });
});

describe("computeFinalPriority", () => {
  it("blends human priority and trust score", () => {
    expect(computeFinalPriority(90, 95)).toBe(92);
    expect(computeFinalPriority(85, 52)).toBe(72);
    expect(computeFinalPriority(0, 100)).toBe(40);
    expect(computeFinalPriority(100, 0)).toBe(60);
  });
});
