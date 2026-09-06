import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FlaskConical, GitCompareArrows } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { whatIf } from "../lib/api";
import { SCHEDULE_DATE } from "../lib/mockData";
import type { WhatIfInput, WhatIfResult } from "../lib/types";
import { AnimatedNumber } from "../components/indicators";
import { TrackDivider } from "../components/transit";
import { Button, Card, CardContent, CardHeader, CardTitle } from "../components/ui";

function Toggle({
  label,
  hint,
  active,
  onChange,
}: {
  label: string;
  hint: string;
  active: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all ${
        active ? "border-ink bg-ink text-paper" : "border-ink/15 bg-white hover:border-ink/40"
      }`}
    >
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className={`text-xs ${active ? "text-paper/60" : "text-ink/50"}`}>{hint}</p>
      </div>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${active ? "bg-line-green" : "bg-ink/15"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${active ? "left-[22px]" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}

function StatsColumn({ title, color, data }: { title: string; color: string; data?: WhatIfResult["before"] }) {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em]">
          <span className="h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: color, backgroundColor: `${color}33` }} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!data ? (
          <p className="py-6 text-center text-sm text-ink/40">Run a simulation to compare.</p>
        ) : (
          <>
            <div className="flex gap-6">
              <div>
                <p className="text-4xl font-black tabular text-line-green">
                  <AnimatedNumber value={data.scheduled} />
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink/45">Scheduled</p>
              </div>
              <div>
                <p className="text-4xl font-black tabular text-line-orange">
                  <AnimatedNumber value={data.deferred} />
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink/45">Unplaced</p>
              </div>
            </div>
            <p className="rounded-lg bg-ink/[0.04] px-3 py-2 text-xs text-ink/70">
              Bottleneck: <span className="font-semibold text-ink">{data.bottleneck}</span>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function WhatIf() {
  const [engineer, setEngineer] = useState(false);
  const [workTrain, setWorkTrain] = useState(false);
  const [window30, setWindow30] = useState(false);
  const [result, setResult] = useState<WhatIfResult | null>(null);

  const mutation = useMutation({
    mutationFn: (input: WhatIfInput) => whatIf(input),
    onSuccess: setResult,
  });

  const simulate = () =>
    mutation.mutate({
      add_crews: engineer ? 1 : 0,
      add_equipment: workTrain ? ["work_train"] : [],
      extra_window_minutes: window30 ? 30 : 0,
      date: SCHEDULE_DATE,
    });

  const chartData = result
    ? [
        { name: "Before", scheduled: result.before.scheduled, unplaced: result.before.deferred },
        { name: "After", scheduled: result.after.scheduled, unplaced: result.after.deferred },
      ]
    : [];

  return (
    <div className="animate-fade-up py-10">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-ink/50">Simulation</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">What-if simulator</h1>
      <TrackDivider color="#FA9E0D" stations={3} className="mt-6 max-w-xs" />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-3">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50">Add resources</p>
          <Toggle
            label="+1 Signalling Engineer"
            hint="Extra crew, 00:00–04:00"
            active={engineer}
            onChange={setEngineer}
          />
          <Toggle
            label="+1 Work Train"
            hint="Second unit allows parallel jobs"
            active={workTrain}
            onChange={setWorkTrain}
          />
          <Toggle
            label="+30 min engineering window"
            hint="All crews stay 30 min longer"
            active={window30}
            onChange={setWindow30}
          />
          <Button size="lg" className="w-full" onClick={simulate} disabled={mutation.isPending || (!engineer && !workTrain && !window30)}>
            <FlaskConical className="h-4 w-4" />
            {mutation.isPending ? "Simulating…" : "Simulate"}
          </Button>
        </div>

        <div className="lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row">
            <StatsColumn title="Before" color="#6B7280" data={result?.before} />
            <StatsColumn title="After" color="#009645" data={result?.after} />
          </div>

          {result && (
            <Card className="mt-4">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <GitCompareArrows className="mt-0.5 h-4 w-4 shrink-0 text-ink/50" />
                  <p className="text-sm font-medium leading-relaxed">{result.impact}</p>
                </div>
                <div className="mt-4 h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barSize={40}>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#11111199" }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#11111199" }} axisLine={false} tickLine={false} width={24} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #11111120", fontSize: 12 }} />
                      <Bar dataKey="scheduled" name="Scheduled" stackId="a" radius={[0, 0, 0, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill="#009645" />
                        ))}
                      </Bar>
                      <Bar dataKey="unplaced" name="Unplaced" stackId="a" radius={[8, 8, 0, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill="#D97706" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-4 text-xs text-ink/60">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-line-green" /> Scheduled
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#D97706]" /> Unplaced
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
