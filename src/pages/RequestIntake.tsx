import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BrainCircuit, CheckCircle2, ShieldAlert } from "lucide-react";
import { computeFinalPriority, createRequest } from "../lib/api";
import { SCHEDULE_DATE, seedEquipment, seedSectors } from "../lib/mockData";
import type { NewRequestInput, RequestType } from "../lib/types";
import { TrustScoreBadge } from "../components/indicators";
import { priorityColor, trustColor } from "../components/badges";
import { TrackDivider } from "../components/transit";
import { Button, Card, CardContent, Input, Label, Select } from "../components/ui";

const SKILL_OPTIONS = ["signalling", "track", "welding", "electrical", "mechanical"];
const TAG_OPTIONS = ["electrical", "mechanical", "water", "hot_work", "fibre_optic"];

/** Deterministic preview of the Trust Engine (backend recomputes on submit). */
function previewTrustScore(title: string): { score: number; evidence: { label: string; good: boolean }[] } {
  let score = 80;
  const evidence = [
    { label: "3 sensors agree", good: true },
    { label: "Model certainty: high", good: true },
    { label: "No OOD detected", good: true },
  ];
  if (/single sensor/i.test(title)) {
    score -= 20;
    evidence[0] = { label: "Single sensor source", good: false };
  }
  if (/anomaly|unusual/i.test(title)) {
    score -= 15;
    evidence[1] = { label: "Model certainty: low", good: false };
    evidence.push({ label: "Anomaly flagged", good: false });
  }
  return { score: Math.max(10, Math.min(100, score)), evidence };
}

function ChipSelect({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`rounded-full border px-3 py-1 font-mono text-[11px] transition-all ${
              active ? "border-ink bg-ink text-paper" : "border-ink/20 text-ink/60 hover:border-ink/50"
            }`}
          >
            {opt.replaceAll("_", " ")}
          </button>
        );
      })}
    </div>
  );
}

export default function RequestIntake() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState<NewRequestInput>({
    title: "",
    type: "planned",
    location: "Track 12",
    duration_minutes: 60,
    deadline: `${SCHEDULE_DATE}T05:00`,
    priority_score: 70,
    required_skills: [],
    required_equipment: [],
    manpower_count: 2,
    work_compatibility_tags: [],
  });

  const trust = useMemo(
    () => (form.type === "predictive" ? previewTrustScore(form.title) : null),
    [form.type, form.title]
  );
  const assumedTrust = trust?.score ?? (form.type === "planned" ? 95 : form.type === "routine" ? 90 : 75);
  const finalPriority = computeFinalPriority(form.priority_score, assumedTrust);

  const mutation = useMutation({
    mutationFn: createRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["requests"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      navigate("/app/requests");
    },
  });

  const toggle = (key: "required_skills" | "required_equipment" | "work_compatibility_tags") => (v: string) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(v) ? f[key].filter((x) => x !== v) : [...f[key], v],
    }));

  return (
    <div className="animate-fade-up py-10">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-ink/50">Intake · New request</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">Log a maintenance request</h1>
      <TrackDivider color="#9900AA" stations={3} className="mt-6 max-w-xs" />

      <form
        className="mt-8 grid gap-6 lg:grid-cols-5"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({ ...form, deadline: `${form.deadline.slice(0, 16)}:00` });
        }}
      >
        <div className="space-y-5 lg:col-span-3">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              required
              placeholder="e.g. Anomaly detected: bearing wear on Track 14 (single sensor)"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1.5"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                id="type"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as RequestType }))}
                className="mt-1.5"
              >
                <option value="planned">Planned</option>
                <option value="routine">Routine</option>
                <option value="manual">Manual</option>
                <option value="predictive">Predictive</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="location">Location / Sector</Label>
              <Select
                id="location"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="mt-1.5"
              >
                {seedSectors.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={15}
                step={15}
                value={form.duration_minutes}
                onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority score ({form.priority_score})</Label>
              <input
                id="priority"
                type="range"
                min={0}
                max={100}
                value={form.priority_score}
                onChange={(e) => setForm((f) => ({ ...f, priority_score: Number(e.target.value) }))}
                className="mt-3 w-full accent-ink"
              />
            </div>
            <div>
              <Label htmlFor="manpower">Manpower</Label>
              <Input
                id="manpower"
                type="number"
                min={1}
                max={12}
                value={form.manpower_count}
                onChange={(e) => setForm((f) => ({ ...f, manpower_count: Number(e.target.value) }))}
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label>Required skills</Label>
            <div className="mt-1.5">
              <ChipSelect options={SKILL_OPTIONS} selected={form.required_skills} onToggle={toggle("required_skills")} />
            </div>
          </div>
          <div>
            <Label>Required equipment</Label>
            <div className="mt-1.5">
              <ChipSelect
                options={seedEquipment.map((e) => e.name)}
                selected={form.required_equipment}
                onToggle={toggle("required_equipment")}
              />
            </div>
          </div>
          <div>
            <Label>Work compatibility tags</Label>
            <div className="mt-1.5">
              <ChipSelect options={TAG_OPTIONS} selected={form.work_compatibility_tags} onToggle={toggle("work_compatibility_tags")} />
            </div>
          </div>

          <Button type="submit" size="lg" disabled={mutation.isPending || form.title.trim() === ""}>
            {mutation.isPending ? "Submitting…" : "Submit request"}
          </Button>
        </div>

        {/* Trust Engine preview */}
        <div className="lg:col-span-2">
          <Card className={`sticky top-24 transition-colors ${form.type === "predictive" ? "border-line-purple/30" : ""}`}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50">
                <BrainCircuit className="h-4 w-4" /> Trust Engine
              </div>

              {form.type === "predictive" ? (
                <>
                  <div className="mt-5 flex items-center gap-4">
                    <TrustScoreBadge score={trust!.score} size={72} />
                    <div>
                      <p className="text-2xl font-black tabular" style={{ color: trustColor(trust!.score) }}>
                        {trust!.score}
                        <span className="text-sm font-semibold text-ink/40">/100</span>
                      </p>
                      <p className="text-xs text-ink/50">
                        {trust!.score < 50 ? "Low confidence — verify manually" : trust!.score <= 80 ? "Moderate confidence" : "High confidence"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    {trust!.evidence.map((e) => (
                      <div key={e.label} className="flex items-center gap-2 text-xs">
                        {e.good ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-line-green" />
                        ) : (
                          <ShieldAlert className="h-3.5 w-3.5 text-line-orange" />
                        )}
                        <span className={e.good ? "text-ink/70" : "font-semibold text-ink"}>{e.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm leading-relaxed text-ink/50">
                  Trust scoring applies to <span className="font-semibold text-ink">predictive</span> requests.{" "}
                  {form.type[0].toUpperCase() + form.type.slice(1)} requests carry a default trust of {assumedTrust}.
                </p>
              )}

              <div className="mt-6 rounded-xl bg-ink/[0.04] p-4">
                <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-ink/50">
                  <span>Final priority</span>
                  <span>0.6·P + 0.4·T</span>
                </div>
                <p className="mt-1 text-3xl font-black tabular" style={{ color: priorityColor(finalPriority) }}>
                  {finalPriority}
                </p>
                <p className="mt-1 font-mono text-[11px] text-ink/45">
                  0.6×{form.priority_score} + 0.4×{assumedTrust}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
