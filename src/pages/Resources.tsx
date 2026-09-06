import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createCrew, createEquipment, createSector,
  deleteCrew, deleteEquipment, deleteSector,
  listCrews, listEquipment, listSectors,
  updateCrew, updateEquipment,
} from "../lib/api";
import type { Crew, Equipment, Sector } from "../lib/types";
import { TrackDivider } from "../components/transit";
import { Badge, Button, Card, Input, Label, Select } from "../components/ui";

// ---------- constants ----------
const ALL_SKILLS = ["signalling", "electrical", "track", "welding", "mechanical"];
const EQUIP_TYPES = ["vehicle", "tool", "instrument", "other"];
const SKILL_COLORS: Record<string, string> = {
  signalling: "#005EC4",
  electrical: "#FA9E0D",
  track: "#009645",
  welding: "#D42E12",
  mechanical: "#9900AA",
};

type Tab = "crews" | "equipment" | "sectors";

// ---------- helpers ----------
function SkillChips({ skills }: { skills: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {skills.map((s) => (
        <Badge key={s} color={SKILL_COLORS[s] ?? "#888"}>{s}</Badge>
      ))}
    </div>
  );
}

function ToggleChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
        selected
          ? "border-ink bg-ink text-paper"
          : "border-ink/20 text-ink/50 hover:border-ink/50 hover:text-ink/80"
      }`}
    >
      {label}
    </button>
  );
}

function AvailableToggle({ available, onChange }: { available: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!available)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        available ? "bg-green-500" : "bg-ink/20"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 translate-x-1 rounded-full bg-white shadow transition-transform ${
          available ? "translate-x-6" : ""
        }`}
      />
    </button>
  );
}

// ============================================================
// CREWS TAB
// ============================================================
function CrewsTab() {
  const qc = useQueryClient();
  const { data: crews = [] } = useQuery({ queryKey: ["crews"], queryFn: listCrews });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Crew | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const blank = (): Omit<Crew, "id"> => ({
    name: "", skills: [], available_start: "00:00", available_end: "04:00", max_concurrent_jobs: 1,
  });
  const [form, setForm] = useState<Omit<Crew, "id">>(blank());

  const invalidate = () => qc.invalidateQueries({ queryKey: ["crews"] });

  const createMut = useMutation({ mutationFn: createCrew, onSuccess: () => { invalidate(); resetForm(); } });
  const updateMut = useMutation({
    mutationFn: ({ id, fields }: { id: number; fields: Partial<Omit<Crew, "id">> }) => updateCrew(id, fields),
    onSuccess: () => { invalidate(); resetForm(); },
  });
  const deleteMut = useMutation({ mutationFn: deleteCrew, onSuccess: () => { invalidate(); setConfirmDelete(null); } });

  function resetForm() {
    setForm(blank());
    setShowForm(false);
    setEditing(null);
  }

  function openEdit(crew: Crew) {
    setEditing(crew);
    setForm({ name: crew.name, skills: crew.skills, available_start: crew.available_start, available_end: crew.available_end, max_concurrent_jobs: crew.max_concurrent_jobs });
    setShowForm(true);
  }

  function toggleSkill(skill: string) {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill) ? f.skills.filter((s) => s !== skill) : [...f.skills, skill],
    }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) updateMut.mutate({ id: editing.id, fields: form });
    else createMut.mutate(form);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink/60">{crews.length} crew team{crews.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => { setEditing(null); setForm(blank()); setShowForm(true); }}>
          <Plus className="h-3.5 w-3.5" /> Add crew
        </Button>
      </div>

      {showForm && (
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">{editing ? "Edit crew" : "New crew"}</h3>
            <button onClick={resetForm} className="text-ink/40 hover:text-ink"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Team name</Label>
              <Input className="mt-1" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Delta Crew" required />
            </div>
            <div>
              <Label>Skills</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALL_SKILLS.map((s) => (
                  <ToggleChip key={s} label={s} selected={form.skills.includes(s)} onClick={() => toggleSkill(s)} />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Available from</Label>
                <Input className="mt-1" type="time" value={form.available_start} onChange={(e) => setForm((f) => ({ ...f, available_start: e.target.value }))} />
              </div>
              <div>
                <Label>Available until</Label>
                <Input className="mt-1" type="time" value={form.available_end} onChange={(e) => setForm((f) => ({ ...f, available_end: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Max concurrent jobs</Label>
              <Input className="mt-1" type="number" min={1} max={5} value={form.max_concurrent_jobs} onChange={(e) => setForm((f) => ({ ...f, max_concurrent_jobs: Number(e.target.value) }))} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                {editing ? "Save changes" : "Add crew"}
              </Button>
              <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/8 bg-ink/[0.02]">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink/50">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink/50">Skills</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink/50 sm:table-cell">Window</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink/50 md:table-cell">Max jobs</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {crews.map((crew) => (
              <tr key={crew.id} className="hover:bg-ink/[0.015]">
                <td className="px-4 py-3 font-medium">{crew.name}</td>
                <td className="px-4 py-3"><SkillChips skills={crew.skills} /></td>
                <td className="hidden px-4 py-3 font-mono text-xs text-ink/60 sm:table-cell">{crew.available_start}–{crew.available_end}</td>
                <td className="hidden px-4 py-3 text-ink/60 md:table-cell">{crew.max_concurrent_jobs}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(crew)} className="rounded-lg p-1.5 text-ink/40 hover:bg-ink/5 hover:text-ink"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setConfirmDelete(crew.id)} className="rounded-lg p-1.5 text-ink/40 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {crews.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-ink/40">No crews yet</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-[2px]">
          <Card className="w-full max-w-sm p-6">
            <h3 className="font-semibold">Delete crew?</h3>
            <p className="mt-1 text-sm text-ink/60">This cannot be undone. Scheduled jobs assigned to this crew will become unassigned.</p>
            <div className="mt-4 flex gap-2">
              <Button variant="destructive" onClick={() => deleteMut.mutate(confirmDelete)}>Delete</Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ============================================================
// EQUIPMENT TAB
// ============================================================
function EquipmentTab() {
  const qc = useQueryClient();
  const { data: equipment = [] } = useQuery({ queryKey: ["equipment"], queryFn: listEquipment });
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<Equipment, "id">>({ name: "", type: "tool", available: true });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["equipment"] });
  const createMut = useMutation({ mutationFn: createEquipment, onSuccess: () => { invalidate(); setShowForm(false); setForm({ name: "", type: "tool", available: true }); } });
  const updateMut = useMutation({
    mutationFn: ({ id, fields }: { id: number; fields: Partial<Omit<Equipment, "id">> }) => updateEquipment(id, fields),
    onSuccess: invalidate,
  });
  const deleteMut = useMutation({ mutationFn: deleteEquipment, onSuccess: () => { invalidate(); setConfirmDelete(null); } });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink/60">{equipment.length} item{equipment.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="h-3.5 w-3.5" /> Add equipment</Button>
      </div>

      {showForm && (
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">New equipment</h3>
            <button onClick={() => setShowForm(false)} className="text-ink/40 hover:text-ink"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(form); }} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input className="mt-1" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. track_geometry_car" required />
            </div>
            <div>
              <Label>Type</Label>
              <Select className="mt-1" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                {EQUIP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Label>Available now</Label>
              <AvailableToggle available={form.available} onChange={(v) => setForm((f) => ({ ...f, available: v }))} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={createMut.isPending}>Add equipment</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/8 bg-ink/[0.02]">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink/50">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink/50">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink/50">Available</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {equipment.map((eq) => (
              <tr key={eq.id} className="hover:bg-ink/[0.015]">
                <td className="px-4 py-3 font-mono text-xs font-medium">{eq.name}</td>
                <td className="px-4 py-3"><Badge>{eq.type}</Badge></td>
                <td className="px-4 py-3">
                  <AvailableToggle available={eq.available} onChange={(v) => updateMut.mutate({ id: eq.id, fields: { available: v } })} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end">
                    <button onClick={() => setConfirmDelete(eq.id)} className="rounded-lg p-1.5 text-ink/40 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {equipment.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-ink/40">No equipment yet</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-[2px]">
          <Card className="w-full max-w-sm p-6">
            <h3 className="font-semibold">Delete equipment?</h3>
            <p className="mt-1 text-sm text-ink/60">This cannot be undone.</p>
            <div className="mt-4 flex gap-2">
              <Button variant="destructive" onClick={() => deleteMut.mutate(confirmDelete)}>Delete</Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SECTORS TAB
// ============================================================
function SectorsTab() {
  const qc = useQueryClient();
  const { data: sectors = [] } = useQuery({ queryKey: ["sectors"], queryFn: listSectors });
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<Sector, "id">>({ name: "", exclusion_zone: [] });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["sectors"] });
  const createMut = useMutation({ mutationFn: createSector, onSuccess: () => { invalidate(); setShowForm(false); setForm({ name: "", exclusion_zone: [] }); } });
  const deleteMut = useMutation({ mutationFn: deleteSector, onSuccess: () => { invalidate(); setConfirmDelete(null); } });

  function toggleExclusion(name: string) {
    setForm((f) => ({
      ...f,
      exclusion_zone: f.exclusion_zone.includes(name)
        ? f.exclusion_zone.filter((z) => z !== name)
        : [...f.exclusion_zone, name],
    }));
  }

  const existingNames = sectors.map((s) => s.name).filter((n) => n !== form.name);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink/60">{sectors.length} sector{sectors.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="h-3.5 w-3.5" /> Add sector</Button>
      </div>

      {showForm && (
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">New sector</h3>
            <button onClick={() => setShowForm(false)} className="text-ink/40 hover:text-ink"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(form); }} className="space-y-4">
            <div>
              <Label>Sector name</Label>
              <Input className="mt-1" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Track 16" required />
            </div>
            {existingNames.length > 0 && (
              <div>
                <Label>Exclusion zones (cannot work simultaneously)</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {existingNames.map((n) => (
                    <ToggleChip key={n} label={n} selected={form.exclusion_zone.includes(n)} onClick={() => toggleExclusion(n)} />
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={createMut.isPending}>Add sector</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/8 bg-ink/[0.02]">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink/50">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink/50">Exclusion zones</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {sectors.map((sector) => (
              <tr key={sector.id} className="hover:bg-ink/[0.015]">
                <td className="px-4 py-3 font-medium">{sector.name}</td>
                <td className="px-4 py-3">
                  {sector.exclusion_zone.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {sector.exclusion_zone.map((z) => <Badge key={z} className="border-red-200 bg-red-50 text-red-700">{z}</Badge>)}
                    </div>
                  ) : (
                    <span className="text-ink/35">None</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end">
                    <button onClick={() => setConfirmDelete(sector.id)} className="rounded-lg p-1.5 text-ink/40 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {sectors.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-ink/40">No sectors yet</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-[2px]">
          <Card className="w-full max-w-sm p-6">
            <h3 className="font-semibold">Delete sector?</h3>
            <p className="mt-1 text-sm text-ink/60">This cannot be undone.</p>
            <div className="mt-4 flex gap-2">
              <Button variant="destructive" onClick={() => deleteMut.mutate(confirmDelete)}>Delete</Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PAGE
// ============================================================
const TABS: { id: Tab; label: string; color: string }[] = [
  { id: "crews", label: "Crews & Teams", color: "#005EC4" },
  { id: "equipment", label: "Equipment", color: "#009645" },
  { id: "sectors", label: "Sectors", color: "#D42E12" },
];

export default function Resources() {
  const [tab, setTab] = useState<Tab>("crews");

  return (
    <div className="animate-fade-up py-10">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-ink/50">Management</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">Resources</h1>
      <TrackDivider color="#0099AA" stations={3} className="mt-6 max-w-xs" />

      <div className="mt-6 flex gap-2">
        {TABS.map((t) => (
          <Button
            key={t.id}
            size="sm"
            variant={tab === t.id ? "default" : "outline"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "crews" && <CrewsTab />}
        {tab === "equipment" && <EquipmentTab />}
        {tab === "sectors" && <SectorsTab />}
      </div>
    </div>
  );
}
