import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import { StationDot, TrackDivider } from "../components/transit";
import { Button, Label } from "../components/ui";

const PERSONAS = [
  { id: "duty-manager", name: "Duty Manager", role: "Full network oversight", color: "#D42E12" },
  { id: "signalling-engineer", name: "Signalling Engineer", role: "Signalling & comms jobs", color: "#005EC4" },
  { id: "track-engineer", name: "Track Engineer", role: "Track & civil jobs", color: "#009645" },
  { id: "maintenance-planner", name: "Maintenance Planner", role: "Scheduling & what-if analysis", color: "#FA9E0D" },
];

export default function Login() {
  const navigate = useNavigate();
  const [persona, setPersona] = useState(PERSONAS[0].id);
  const selected = PERSONAS.find((p) => p.id === persona)!;

  const signIn = () => {
    localStorage.setItem("cascade.persona", selected.name);
    navigate("/app");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-6">
      {/* decorative track lines */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-16 opacity-[0.12]">
        <TrackDivider color="#D42E12" stations={6} animated />
        <TrackDivider color="#009645" stations={5} animated />
        <TrackDivider color="#9900AA" stations={6} animated />
        <TrackDivider color="#FA9E0D" stations={5} animated />
      </div>

      <div className="relative w-full max-w-sm animate-fade-up">
        <div className="mb-8 text-center">
          <span className="mx-auto block h-11 w-11 overflow-hidden rounded-xl">
            <img src="/cascade-logo.png" alt="Cascade logo" className="h-full w-full scale-[1.14] object-cover" />
          </span>
          <h1 className="mt-4 text-2xl font-black tracking-[0.22em]">CASCADE</h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.25em] text-ink/45">Night ops console</p>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
          <Label htmlFor="persona">Sign in as</Label>
          <div className="relative mt-2">
            <select
              id="persona"
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className="h-12 w-full appearance-none rounded-xl border border-ink/15 bg-white pl-4 pr-10 text-sm font-semibold focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
            >
              {PERSONAS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-xl bg-ink/[0.04] p-3">
            <StationDot color={selected.color} active />
            <div>
              <p className="text-sm font-semibold">{selected.name}</p>
              <p className="text-xs text-ink/50">{selected.role}</p>
            </div>
          </div>

          <Button size="lg" className="mt-5 w-full" onClick={signIn}>
            Enter console <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-ink/35">
          Engineering window 00:00–06:00 · MRT Network
        </p>
      </div>
    </div>
  );
}
