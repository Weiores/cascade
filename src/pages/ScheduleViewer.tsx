import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Info, Play } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { applySuggestion, getConflictSuggestions, getSchedule, optimise } from "../lib/api";
import { SCHEDULE_DATE } from "../lib/mockData";
import type { ConflictSuggestion, MaintenanceRequest } from "../lib/types";
import ConflictCard from "../components/ConflictCard";
import { Dialog } from "../components/Dialog";
import ScheduleTimeline from "../components/ScheduleTimeline";
import { TrackDivider } from "../components/transit";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "../components/ui";

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
            <ScheduleTimeline crews={data.crews} jobs={data.schedule} />
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
