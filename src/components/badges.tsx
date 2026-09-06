import type { RequestStatus, RequestType } from "../lib/types";
import { Badge } from "./ui";

export const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "#6B7280" },
  scheduled: { label: "Scheduled", color: "#009645" },
  deferred: { label: "Deferred", color: "#D97706" },
  in_conflict: { label: "Conflict", color: "#D42E12" },
};

export const TYPE_CONFIG: Record<RequestType, { label: string; color: string }> = {
  planned: { label: "Planned", color: "#005EC4" },
  routine: { label: "Routine", color: "#009645" },
  manual: { label: "Manual", color: "#9D5B25" },
  predictive: { label: "Predictive", color: "#9900AA" },
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const c = STATUS_CONFIG[status];
  return (
    <Badge color={c.color}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.color }} />
      {c.label}
    </Badge>
  );
}

export function TypeBadge({ type }: { type: RequestType }) {
  const c = TYPE_CONFIG[type];
  return <Badge color={c.color}>{c.label}</Badge>;
}

export function priorityColor(score: number): string {
  if (score >= 80) return "#D42E12";
  if (score >= 65) return "#D97706";
  if (score >= 50) return "#005EC4";
  return "#6B7280";
}

export function trustColor(score: number): string {
  if (score < 50) return "#D42E12";
  if (score <= 80) return "#D97706";
  return "#009645";
}
