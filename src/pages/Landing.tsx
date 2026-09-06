import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BrainCircuit, GitBranch, Radar, SlidersHorizontal, TrainFront, TrendingUp, Wrench } from "lucide-react";
import TransitMap from "../components/TransitMap";
import { TrackDivider, StationDot } from "../components/transit";
import { TrustScoreBadge } from "../components/indicators";
import ScheduleTimeline from "../components/ScheduleTimeline";
import { Button } from "../components/ui";
import type { Crew, MaintenanceRequest } from "../lib/types";

const TICKER_ITEMS = [
  "TRUST ENGINE",
  "CONFLICT DETECTION",
  "AUTO-RESOLUTION",
  "BOTTLENECK ANALYSIS",
  "WHAT-IF SIMULATION",
  "NIGHT OPS 00:00–06:00",
];

const FEATURES = [
  {
    icon: BrainCircuit,
    color: "#9900AA",
    title: "Trust Engine",
    body: "Every predictive alert gets a confidence score from 0–100. Single-sensor anomalies and unusual readings are automatically discounted — so the schedule believes the signal, not the noise.",
  },
  {
    icon: TrendingUp,
    color: "#005EC4",
    title: "Smart Prioritisation",
    body: "Final priority blends operational urgency with trust: 0.6 × priority + 0.4 × trust. A critical job with shaky evidence won't outrank a solid one.",
  },
  {
    icon: Radar,
    color: "#D42E12",
    title: "Conflict Detection",
    body: "Six checks run against every placement: sector overlap, crew double-booking, equipment contention, adjacent exclusion zones, incompatible work types and deadline breaches.",
  },
  {
    icon: Wrench,
    color: "#009645",
    title: "Auto-Resolution",
    body: "Each conflict comes with concrete alternatives — move the time, change the crew, bundle with a nearby job, split the work, or defer. One click applies it.",
  },
  {
    icon: GitBranch,
    color: "#FA9E0D",
    title: "Bottleneck Analysis",
    body: "After every run, Cascade names the binding constraint — crew, equipment, sector access or time — with a breakdown of what blocked what.",
  },
  {
    icon: SlidersHorizontal,
    color: "#9D5B25",
    title: "What-If Simulator",
    body: "Add a signalling engineer, a second work train, or 30 more minutes of window. See side-by-side how many jobs clear before you commit.",
  },
];

const demoCrews: Crew[] = [
  { id: 1, name: "Alpha Crew", skills: ["signalling"], available_start: "00:00", available_end: "04:00", max_concurrent_jobs: 2 },
  { id: 2, name: "Bravo Crew", skills: ["track"], available_start: "00:00", available_end: "06:00", max_concurrent_jobs: 1 },
];

const demoJobs: MaintenanceRequest[] = [
  {
    id: 1, title: "Point machine replacement", type: "planned", location: "Track 12",
    duration_minutes: 120, deadline: "", priority_score: 90, trust_score: 95, final_priority: 92,
    required_skills: ["signalling"], required_equipment: [], manpower_count: 4, work_compatibility_tags: [],
    status: "scheduled", scheduled_start: "2026-09-01T00:15:00", scheduled_end: "2026-09-01T02:15:00", assigned_crew_id: 1, conflict_reason: null,
  },
  {
    id: 2, title: "Weld repair", type: "manual", location: "Track 14",
    duration_minutes: 120, deadline: "", priority_score: 80, trust_score: 75, final_priority: 78,
    required_skills: ["welding"], required_equipment: [], manpower_count: 3, work_compatibility_tags: [],
    status: "scheduled", scheduled_start: "2026-09-01T02:30:00", scheduled_end: "2026-09-01T04:30:00", assigned_crew_id: 2, conflict_reason: null,
  },
  {
    id: 3, title: "Signal cable test", type: "routine", location: "Track 12",
    duration_minutes: 60, deadline: "", priority_score: 60, trust_score: 90, final_priority: 72,
    required_skills: ["signalling"], required_equipment: [], manpower_count: 2, work_compatibility_tags: [],
    status: "scheduled", scheduled_start: "2026-09-01T02:45:00", scheduled_end: "2026-09-01T03:45:00", assigned_crew_id: 1, conflict_reason: null,
  },
];

export default function Landing() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [shift, setShift] = useState(0);

  useEffect(() => {
    const update = () => {
      const section = sectionRef.current;
      const track = trackRef.current;
      if (!section || !track) return;
      const rect = section.getBoundingClientRect();
      const scrollable = section.offsetHeight - window.innerHeight;
      const p = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;
      setProgress(p);
      const maxShift = Math.max(0, track.scrollWidth - window.innerWidth + 48);
      setShift(p * maxShift);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* nav */}
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="block h-[26px] w-[26px] overflow-hidden rounded-[7px]">
              <img src="/cascade-logo.png" alt="Cascade logo" className="h-full w-full scale-[1.14] object-cover" />
            </span>
            <span className="font-display text-lg font-extrabold tracking-[0.08em]">CASCADE</span>
          </div>
          <Link to="/login">
            <Button size="sm">Sign in</Button>
          </Link>
        </div>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 pb-16 pt-16 sm:pt-24 lg:grid-cols-2">
          <div className="relative z-10">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-ink/50">
              Maintenance Scheduling Optimiser
            </p>
            <h1 className="mt-5 text-6xl font-black leading-[0.98] tracking-tight sm:text-7xl">
              Every night,
              <br />
              the network
              <br />
              resets.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink/60">
              Cascade turns a pile of maintenance requests into one optimised nightly schedule — trust-scored,
              conflict-checked, and bottleneck-analysed before the first train of the morning.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/login">
                <Button size="lg">
                  Enter Cascade <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <span className="font-mono text-xs text-ink/45">ENGINEERING WINDOW 00:00–06:00</span>
            </div>
          </div>
          <div className="relative">
            <TransitMap className="w-full" />
          </div>
        </div>

        {/* ticker */}
        <div className="border-y border-ink/10 bg-white py-3">
          <div className="flex w-max animate-ticker gap-8 whitespace-nowrap">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="flex items-center gap-8 font-mono text-[11px] font-semibold tracking-[0.25em] text-ink/60">
                {item}
                <StationDot color={Object.values({ a: "#D42E12", b: "#009645", c: "#9900AA", d: "#FA9E0D", e: "#005EC4", f: "#9D5B25" })[i % 6]} />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* live preview strip */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-ink/50">The output</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight">A running diagram, not a spreadsheet.</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink/60">
              Crews are tracks. Jobs are trains. You see the whole night at a glance — what's placed, what clashed,
              and exactly why.
            </p>
            <div className="mt-6 flex items-center gap-4 rounded-2xl border border-ink/10 bg-white p-4">
              <TrustScoreBadge score={88} size={56} />
              <div className="text-sm">
                <p className="font-semibold">Trust-scored before it's scheduled</p>
                <p className="text-ink/55">3 sensors agree · Model certainty: high · No OOD detected</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <ScheduleTimeline crews={demoCrews} jobs={demoJobs} />
          </div>
        </div>
      </section>

      <TrackDivider color="#111111" stations={5} animated className="mx-auto max-w-6xl px-6 opacity-30" />

      {/* features — horizontal rail driven by vertical scroll */}
      <section ref={sectionRef} className="relative" style={{ height: "320vh" }}>
        <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-ink/50">Under the hood</p>
                <h2 className="mt-4 text-4xl font-black tracking-tight">Six systems, one calm night.</h2>
              </div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/40">Scroll to ride the line →</p>
            </div>
            {/* progress rail */}
            <div className="relative mt-6 h-px w-full bg-ink/10">
              <div
                className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-ink transition-none"
                style={{ width: `${progress * 100}%` }}
              />
              <TrainFront
                className="absolute bottom-0 h-5 w-5 -translate-x-1/2 text-ink"
                strokeWidth={2.2}
                style={{ left: `${progress * 100}%` }}
              />
            </div>
          </div>

          <div className="relative mt-10">
            {/* track line the cards ride on */}
            <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-ink/8" aria-hidden />
            <div
              ref={trackRef}
              className="flex w-max gap-4 px-6 will-change-transform"
              style={{ transform: `translateX(${-shift}px)` }}
            >
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className="group w-[320px] shrink-0 rounded-2xl border border-ink/10 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)] sm:w-[360px]"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${f.color}14`, color: f.color }}
                    >
                      <f.icon className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-xs text-ink/30">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold tracking-tight">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/60">{f.body}</p>
                  <div className="mt-4 h-1 w-8 rounded-full transition-all group-hover:w-16" style={{ backgroundColor: f.color }} />
                </div>
              ))}
              {/* end-of-line marker */}
              <div className="flex w-[200px] shrink-0 items-center justify-center">
                <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink/35">End of line</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* final CTA */}
      <section className="border-t border-ink/10 bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-paper/50">Ready for tonight</p>
          <h2 className="mx-auto mt-4 max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
            The window opens at 00:00. Be scheduled by 00:01.
          </h2>
          <Link to="/login">
            <Button size="lg" className="mt-8 bg-paper text-ink hover:bg-paper/90">
              Enter Cascade <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="border-t border-paper/10 py-6 text-center font-mono text-[11px] text-paper/40">
          CASCADE · MAINTENANCE SCHEDULING OPTIMISER
        </div>
      </section>
    </div>
  );
}
