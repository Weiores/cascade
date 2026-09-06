import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { listRequests } from "../lib/api";
import type { MaintenanceRequest, RequestStatus } from "../lib/types";
import { isoToTime } from "../lib/utils";
import { PriorityPill, TrustScoreBadge } from "../components/indicators";
import { StatusBadge, TypeBadge } from "../components/badges";
import { TrackDivider } from "../components/transit";
import { Button, Card } from "../components/ui";

const FILTERS: { value: RequestStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "scheduled", label: "Scheduled" },
  { value: "deferred", label: "Deferred" },
  { value: "in_conflict", label: "Conflict" },
];

export default function RequestsList() {
  const [filter, setFilter] = useState<RequestStatus | "all">("all");
  const [selected, setSelected] = useState<MaintenanceRequest | null>(null);

  const { data = [] } = useQuery({
    queryKey: ["requests", filter],
    queryFn: () => listRequests(filter === "all" ? undefined : filter),
  });

  return (
    <div className="animate-fade-up py-10">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-ink/50">Registry</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">Maintenance requests</h1>
      <TrackDivider color="#005EC4" stations={3} className="mt-6 max-w-xs" />

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? "default" : "outline"}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left font-mono text-[10px] uppercase tracking-wider text-ink/45">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Location</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Dur.</th>
                <th className="px-4 py-3 font-medium">Trust</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={`cursor-pointer border-b border-ink/5 transition-colors last:border-0 hover:bg-ink/[0.03] ${
                    selected?.id === r.id ? "bg-ink/[0.04]" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-ink/50">#{r.id}</td>
                  <td className="max-w-[280px] truncate px-4 py-3 font-medium">{r.title}</td>
                  <td className="px-4 py-3">
                    <TypeBadge type={r.type} />
                  </td>
                  <td className="hidden px-4 py-3 text-ink/60 md:table-cell">{r.location}</td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-ink/60 lg:table-cell">{r.duration_minutes}m</td>
                  <td className="px-4 py-3">
                    <TrustScoreBadge score={r.trust_score} size={36} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityPill score={r.final_priority} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-ink/40">
                    No requests with this status.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* detail sidebar */}
      {selected && (
        <div className="fixed inset-0 z-50" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" />
          <aside
            className="absolute right-0 top-0 flex h-full w-full max-w-md animate-fade-up flex-col overflow-y-auto border-l border-ink/10 bg-paper p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-ink/40">#{selected.id}</span>
                <TypeBadge type={selected.type} />
                <StatusBadge status={selected.status} />
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelected(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <h2 className="mt-4 text-xl font-bold leading-snug tracking-tight">{selected.title}</h2>

            <div className="mt-6 flex items-center gap-6 rounded-2xl border border-ink/10 bg-white p-4">
              <div className="text-center">
                <TrustScoreBadge score={selected.trust_score} size={56} />
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink/45">Trust</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black tabular">{selected.final_priority}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink/45">Final priority</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black tabular">{selected.priority_score}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink/45">Base priority</p>
              </div>
            </div>

            <dl className="mt-6 space-y-3 text-sm">
              {[
                ["Location", selected.location],
                ["Duration", `${selected.duration_minutes} min`],
                ["Deadline", selected.deadline.replace("T", " ").slice(0, 16)],
                ["Manpower", String(selected.manpower_count)],
                ["Skills", selected.required_skills.join(", ") || "—"],
                ["Equipment", selected.required_equipment.map((e) => e.replaceAll("_", " ")).join(", ") || "—"],
                ["Work tags", selected.work_compatibility_tags.join(", ") || "—"],
                [
                  "Scheduled",
                  selected.scheduled_start && selected.scheduled_end
                    ? `${isoToTime(selected.scheduled_start)} – ${isoToTime(selected.scheduled_end)}`
                    : "—",
                ],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-ink/5 pb-2">
                  <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/45">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
              {selected.conflict_reason && (
                <div className="rounded-xl border border-line-red/30 bg-line-red/[0.05] p-3 text-xs text-line-red">
                  {selected.conflict_reason}
                </div>
              )}
            </dl>
          </aside>
        </div>
      )}
    </div>
  );
}
