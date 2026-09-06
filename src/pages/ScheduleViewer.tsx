import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Clock, Info, MapPin, Play, Users, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { applySuggestion, getConflictSuggestions, getSchedule, optimise } from "../lib/api";
import { SCHEDULE_DATE } from "../lib/mockData";
import type { ConflictSuggestion, MaintenanceRequest } from "../lib/types";
import { isoToTime } from "../lib/utils";
import ConflictCard from "../components/ConflictCard";
import { Dialog } from "../components/Dialog";
import ScheduleTimeline from "../components/ScheduleTimeline";
import { StatusBadge, TypeBadge } from "../components/badges";
import { PriorityPill, TrustScoreBadge } from "../components/indicators";
import { TrackDivider } from "../components/transit";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "../components/ui";

const SUGGESTION_LABELS: Record<ConflictSuggestion["type"], string> = {
  change_time: "Change time",
  change_crew: "Change crew",
  bundle: "Bundle",
  defer: "Defer",
  split: "Split",
};

export default function ScheduleViewer() {
  const qc = useQueryClient();
  const [date, setDate] = useState(SCHEDULE_DATE);
  const [resolving, setResolving] = useState<MaintenanceRequest | null>(null);
  const [expandedJob, setExpandedJob] = useState<MaintenanceRequest | null>(null);

  const { data } = useQuery({ queryKey: ["schedule", date], queryFn: () => getSchedule(date) });

  const { data: suggestions = [], isFetching: loadingSuggestions } = useQuery({
    queryKey: ["suggestions", resolving?.id],
    queryFn: () => getConflictSuggestions(resolving!.id),
    enabled: resolving !== null,
  });

  const optimiseMut = useMutation({
    mutationFn: () => optimise(date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedule"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["requests"] });
    },
  });

  const applyMut = useMutation({
    mutationFn: (s: ConflictSuggestion) => applySuggestion(resolving!.id, s),
    onSuccess: () => {
      setResolving(null);
      qc.invalidateQueries({ queryKey: ["schedule"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["requests"] });
    },
  });

  const hasRun = data !== undefined && (data.schedule.length > 0 || data.conflicts.length > 0 || data.deferred.length > 0);

  const [searchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get("autorun") === "1" && data && !hasRun && !optimiseMut.isPending && !optimiseMut.isSuccess) {
      optimiseMut.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, hasRun]);

  return (
    <div className="animate-fade-up py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-ink/50">Running diagram</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">Nightly schedule</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-ink/40" />
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
          </div>
          <Button onClick={() => optimiseMut.mutate()} disabled={optimiseMut.isPending}>
            <Play className="h-4 w-4" />
            {optimiseMut.isPending ? "Optimising…" : "Run Optimisation"}
          </Button>
        </div>
      </div>
      <TrackDivider color="#009645" stations={4} className="mt-6 max-w-xs" />

      {/* bottleneck banner */}
      {hasRun && data.bottleneck && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-line-orange/40 bg-line-orange/[0.07] p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-line-orange" />
          <p className="text-sm">
            <span className="font-bold">Tonight's primary bottleneck: {data.bottleneck}.</span>{" "}
            <span className="text-ink/60">
              {data.conflicts.length + data.deferred.length} jobs couldn't be placed · utilisation{" "}
              {data.utilisation_rate}%. Try the What-If simulator to test extra resources.
            </span>
          </p>
        </div>
      )}

      {/* timeline */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/50">
            Crew tracks · 00:00–06:00
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasRun ? (
            <div className="flex h-40 flex-col items-center justify-center gap-3 text-sm text-ink/40">
              <p>No schedule computed for this date yet.</p>
              <Button variant="outline" size="sm" onClick={() => optimiseMut.mutate()} disabled={optimiseMut.isPending}>
                <Play className="h-3 w-3" /> Run optimisation
              </Button>
            </div>
          ) : (
            <ScheduleTimeline crews={data.crews} jobs={data.schedule} onJobClick={setExpandedJob} />
          )}
          {hasRun && (
            <div className="mt-4 flex flex-wrap gap-4 border-t border-ink/8 pt-3 text-xs text-ink/60">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-line-green" /> Scheduled
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-line-red" /> Conflict
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-line-orange" /> Deferred
              </span>
              <span className="ml-auto font-mono text-[11px] text-ink/40">
                {data.schedule.length} on track · {data.conflicts.length} conflicts · {data.deferred.length} deferred
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* conflicts */}
      {hasRun && data.conflicts.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold tracking-tight">
            Conflicts <span className="font-mono text-sm font-medium text-line-red">({data.conflicts.length})</span>
          </h2>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {data.conflicts.map((r) => (
              <ConflictCard key={r.id} request={r} onResolve={setResolving} />
            ))}
          </div>
        </section>
      )}

      {/* deferred */}
      {hasRun && data.deferred.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold tracking-tight">
            Deferred <span className="font-mono text-sm font-medium text-line-orange">({data.deferred.length})</span>
          </h2>
          <div className="mt-3 space-y-2">
            {data.deferred.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm">
                <div className="min-w-0">
                  <span className="font-mono text-[10px] text-ink/40">#{r.id}</span>{" "}
                  <span className="font-medium">{r.title}</span>
                  <p className="truncate text-xs text-ink/50">{r.conflict_reason}</p>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-ink/45">{r.duration_minutes}m · {r.location}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* job detail drawer */}
      {expandedJob && (
        <div className="fixed inset-0 z-50" onClick={() => setExpandedJob(null)}>
          <div
            className="animate-fade-up absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-paper shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-ink/10 bg-paper/95 px-5 py-4 backdrop-blur">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <TypeBadge type={expandedJob.type} />
                  <StatusBadge status={expandedJob.status} />
                </div>
                <h2 className="mt-2 text-base font-bold leading-snug">{expandedJob.title}</h2>
                <p className="mt-0.5 font-mono text-[11px] text-ink/40">Job #{expandedJob.id}</p>
              </div>
              <button onClick={() => setExpandedJob(null)} className="shrink-0 rounded-full p-1.5 text-ink/40 hover:bg-ink/5 hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 px-5 py-5">
              {/* scores */}
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-1">
                  <TrustScoreBadge score={expandedJob.trust_score} size={52} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-ink/45">Trust</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <PriorityPill score={expandedJob.final_priority} className="text-base" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-ink/45">Priority</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="font-mono text-lg font-bold text-ink/80">{expandedJob.priority_score}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-ink/45">Base</span>
                </div>
              </div>

              {/* conflict reason */}
              {expandedJob.status === "in_conflict" && expandedJob.conflict_reason && (
                <div className="rounded-xl border border-line-red/30 bg-line-red/[0.06] p-3">
                  <p className="text-xs font-semibold text-line-red">Conflict: {expandedJob.conflict_reason}</p>
                </div>
              )}

              {/* scheduled window */}
              {expandedJob.scheduled_start && expandedJob.scheduled_end && (
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink/45">Scheduled window</p>
                  <div className="flex items-center gap-2 rounded-xl bg-ink/[0.03] px-3 py-2.5">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-ink/40" />
                    <span className="font-mono text-sm font-semibold">
                      {isoToTime(expandedJob.scheduled_start)} → {isoToTime(expandedJob.scheduled_end)}
                    </span>
                    <span className="ml-auto font-mono text-xs text-ink/45">{expandedJob.duration_minutes}m</span>
                  </div>
                  {data?.crews && expandedJob.assigned_crew_id != null && (
                    <div className="mt-1.5 flex items-center gap-2 rounded-xl bg-ink/[0.03] px-3 py-2.5">
                      <Users className="h-3.5 w-3.5 shrink-0 text-ink/40" />
                      <span className="text-sm">{data.crews.find((c) => c.id === expandedJob.assigned_crew_id)?.name ?? `Crew #${expandedJob.assigned_crew_id}`}</span>
                    </div>
                  )}
                </div>
              )}

              {/* location & deadline */}
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink/45">Location</dt>
                  <dd className="flex items-center gap-1.5 text-sm font-medium">
                    <MapPin className="h-3.5 w-3.5 text-ink/40" />{expandedJob.location}
                  </dd>
                </div>
                <div>
                  <dt className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink/45">Manpower</dt>
                  <dd className="text-sm font-medium">{expandedJob.manpower_count} engineer{expandedJob.manpower_count !== 1 ? "s" : ""}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink/45">Deadline</dt>
                  <dd className="font-mono text-sm">{expandedJob.deadline.replace("T", " ").substring(0, 16)}</dd>
                </div>
              </dl>

              {/* skills */}
              {expandedJob.required_skills.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink/45">Required skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {expandedJob.required_skills.map((s) => <Badge key={s} color="#005EC4">{s}</Badge>)}
                  </div>
                </div>
              )}

              {/* equipment */}
              {expandedJob.required_equipment.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink/45">Required equipment</p>
                  <div className="flex flex-wrap gap-1.5">
                    {expandedJob.required_equipment.map((e) => <Badge key={e}>{e.replaceAll("_", " ")}</Badge>)}
                  </div>
                </div>
              )}

              {/* work tags */}
              {expandedJob.work_compatibility_tags.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink/45">Work type tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {expandedJob.work_compatibility_tags.map((t) => <Badge key={t} color="#9D5B25">{t}</Badge>)}
                  </div>
                </div>
              )}

              {/* actions */}
              <div className="flex gap-2 border-t border-ink/8 pt-4">
                {expandedJob.status === "in_conflict" && (
                  <Button size="sm" onClick={() => { setResolving(expandedJob); setExpandedJob(null); }}>
                    Resolve conflict
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setExpandedJob(null)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* resolve modal */}
      <Dialog open={resolving !== null} onClose={() => setResolving(null)} title={resolving ? `Resolve: ${resolving.title}` : ""}>
        {loadingSuggestions ? (
          <p className="py-6 text-center text-sm text-ink/50">Generating alternatives…</p>
        ) : (
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => applyMut.mutate(s)}
                disabled={applyMut.isPending}
                className="group flex w-full items-center gap-3 rounded-xl border border-ink/10 bg-white p-3 text-left transition-all hover:border-ink hover:shadow-sm"
              >
                <span className="shrink-0 rounded-md bg-ink/[0.06] px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink/60 group-hover:bg-ink group-hover:text-paper">
                  {SUGGESTION_LABELS[s.type]}
                </span>
                <span className="text-sm leading-snug text-ink/80">{s.description}</span>
              </button>
            ))}
          </div>
        )}
      </Dialog>
    </div>
  );
}
