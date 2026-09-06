import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getDashboard, optimise } from "../lib/api";
import { SCHEDULE_DATE } from "../lib/mockData";
import { AnimatedNumber, PriorityPill } from "../components/indicators";
import { StatusBadge, TYPE_CONFIG } from "../components/badges";
import { TrackDivider } from "../components/transit";
import TransitMap from "../components/TransitMap";
import { Button, Card, CardContent, CardHeader, CardTitle } from "../components/ui";

const BOTTLENECK_COLORS: Record<string, string> = {
  crew: "#D42E12",
  equipment: "#FA9E0D",
  sector: "#005EC4",
  time: "#9900AA",
};

export default function Dashboard() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: getDashboard });
  const optimiseMut = useMutation({
    mutationFn: () => optimise(SCHEDULE_DATE),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["schedule"] });
      qc.invalidateQueries({ queryKey: ["requests"] });
    },
  });

  const statusData = data
    ? [
        { name: "Scheduled", value: data.scheduled, color: "#009645" },
        { name: "Deferred", value: data.deferred, color: "#D97706" },
        { name: "Conflict", value: data.in_conflict, color: "#D42E12" },
        { name: "Pending", value: data.pending, color: "#9CA3AF" },
      ]
    : [];

  const bottleneckData = data
    ? (Object.entries(data.bottleneck_breakdown) as [string, number][])
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: k[0].toUpperCase() + k.slice(1), value: v, color: BOTTLENECK_COLORS[k] }))
    : [];

  const kpis = [
    { label: "Total Requests", value: data?.total_requests ?? 0 },
    { label: "Scheduled", value: data?.scheduled ?? 0, color: "#009645" },
    { label: "Deferred", value: data?.deferred ?? 0, color: "#D97706" },
    { label: "Avg Trust Score", value: data?.avg_trust_score ?? 0 },
  ];

  return (
    <div className="animate-fade-up">
      {/* hero */}
      <section className="relative overflow-hidden py-10 sm:py-14">
        <div className="relative z-10 max-w-2xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-ink/50">
            Night Ops · {SCHEDULE_DATE} · Engineering window 00:00–06:00
          </p>
          <h1 className="mt-4 text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl">
            Tonight's network,
            <br />
            kept on track.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink/60">
            Trust-scored maintenance scheduling with conflict detection, auto-resolution and bottleneck analysis.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Button size="lg" onClick={() => optimiseMut.mutate()} disabled={optimiseMut.isPending}>
              <Play className="h-4 w-4" />
              {optimiseMut.isPending ? "Optimising…" : "Run Optimisation"}
            </Button>
            <span className="font-mono text-xs text-ink/45">
              Bottleneck: <span className="font-semibold text-ink">{data?.bottleneck ?? "—"}</span>
            </span>
          </div>
        </div>
        <TransitMap className="pointer-events-none absolute -right-16 top-1/2 hidden w-[620px] -translate-y-1/2 opacity-90 md:block" />
      </section>

      {/* KPI cards */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/45">{kpi.label}</p>
            <p className="mt-2 text-4xl font-black tracking-tight" style={{ color: kpi.color }}>
              <AnimatedNumber value={kpi.value} />
            </p>
          </Card>
        ))}
      </section>

      <TrackDivider color="#111111" stations={4} animated className="my-8 opacity-40" />

      {/* charts */}
      <section className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/50">
              Jobs by status
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} barSize={44}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#11111199" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#11111199" }} axisLine={false} tickLine={false} width={24} />
                <Tooltip cursor={{ fill: "#11111108" }} contentStyle={{ borderRadius: 12, border: "1px solid #11111120", fontSize: 12 }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {statusData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/50">
              Bottleneck breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {bottleneckData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-ink/40">
                Run optimisation to see bottlenecks
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={bottleneckData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} strokeWidth={0}>
                    {bottleneckData.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #11111120", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
          <div className="flex flex-wrap gap-3 px-5 pb-4">
            {bottleneckData.map((d) => (
              <span key={d.name} className="flex items-center gap-1.5 text-xs text-ink/60">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name} {d.value}
              </span>
            ))}
          </div>
        </Card>
      </section>

      {/* top deferred */}
      <section className="mt-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/50">
              Top deferred critical jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!data || data.top_deferred.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-ink/40">No deferred jobs — run optimisation first.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-ink/10 text-left font-mono text-[10px] uppercase tracking-wider text-ink/45">
                    <th className="px-5 py-2 font-medium">ID</th>
                    <th className="px-5 py-2 font-medium">Job</th>
                    <th className="hidden px-5 py-2 font-medium sm:table-cell">Location</th>
                    <th className="px-5 py-2 font-medium">Priority</th>
                    <th className="px-5 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_deferred.map((r) => (
                    <tr key={r.id} className="border-b border-ink/5 last:border-0 hover:bg-ink/[0.02]">
                      <td className="px-5 py-3 font-mono text-xs text-ink/50">#{r.id}</td>
                      <td className="max-w-0 truncate px-5 py-3 font-medium">
                        <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: TYPE_CONFIG[r.type].color }} />
                        {r.title}
                      </td>
                      <td className="hidden px-5 py-3 text-ink/60 sm:table-cell">{r.location}</td>
                      <td className="px-5 py-3">
                        <PriorityPill score={r.final_priority} />
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
