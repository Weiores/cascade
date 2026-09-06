import type { Crew, MaintenanceRequest } from "../lib/types";
import { isoToTime, timeToMinutes } from "../lib/utils";
import { STATUS_CONFIG } from "./badges";

/**
 * Train running diagram: rows = crews, x-axis = time (00:00-06:00).
 * Jobs render as track bars with station-dot endpoints.
 */
export default function ScheduleTimeline({
  crews,
  jobs,
  startMin = 0,
  endMin = 360,
  onJobClick,
}: {
  crews: Crew[];
  jobs: MaintenanceRequest[];
  startMin?: number;
  endMin?: number;
  onJobClick?: (job: MaintenanceRequest) => void;
}) {
  const span = endMin - startMin;
  const hours = Array.from({ length: span / 60 + 1 }, (_, i) => startMin + i * 60);

  const pct = (min: number) => ((min - startMin) / span) * 100;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        {/* hour ruler */}
        <div className="relative ml-36 h-6">
          {hours.map((h) => (
            <span
              key={h}
              className="absolute -translate-x-1/2 font-mono text-[10px] text-ink/45"
              style={{ left: `${pct(h)}%` }}
            >
              {`${String(Math.floor(h / 60)).padStart(2, "0")}:00`}
            </span>
          ))}
        </div>

        <div className="relative">
          {/* gridlines */}
          <div className="pointer-events-none absolute inset-y-0 left-36 right-0">
            {hours.map((h) => (
              <div
                key={h}
                className="absolute inset-y-0 border-l border-ink/8"
                style={{ left: `${pct(h)}%` }}
              />
            ))}
          </div>

          {crews.map((crew) => {
            const crewJobs = jobs.filter((j) => j.assigned_crew_id === crew.id && j.scheduled_start && j.scheduled_end);
            return (
              <div key={crew.id} className="relative flex h-14 items-center border-t border-ink/8">
                <div className="w-36 shrink-0 pr-4">
                  <div className="text-xs font-semibold">{crew.name}</div>
                  <div className="font-mono text-[10px] text-ink/45">
                    {crew.available_start}–{crew.available_end}
                  </div>
                </div>
                <div className="relative h-full flex-1">
                  {/* availability window */}
                  <div
                    className="absolute inset-y-2 rounded-md bg-ink/[0.04]"
                    style={{
                      left: `${pct(timeToMinutes(crew.available_start))}%`,
                      width: `${pct(timeToMinutes(crew.available_end)) - pct(timeToMinutes(crew.available_start))}%`,
                    }}
                  />
                  {crewJobs.map((job) => {
                    const s = timeToMinutes(isoToTime(job.scheduled_start!));
                    const e = timeToMinutes(isoToTime(job.scheduled_end!));
                    const color = STATUS_CONFIG[job.status].color;
                    return (
                      <div
                        key={job.id}
                        title={`#${job.id} ${job.title} · ${isoToTime(job.scheduled_start!)}–${isoToTime(job.scheduled_end!)} · ${job.location}`}
                        onClick={() => onJobClick?.(job)}
                        className={`group absolute inset-y-3 flex items-center rounded-full transition-transform hover:z-10 hover:scale-y-110 ${onJobClick ? "cursor-pointer" : "cursor-default"}`}
                        style={{
                          left: `${pct(s)}%`,
                          width: `${Math.max(pct(e) - pct(s), 1.5)}%`,
                          backgroundColor: color,
                        }}
                      >
                        <span className="ml-1 h-2 w-2 shrink-0 rounded-full border border-white bg-white/90" />
                        <span className="mx-1.5 truncate text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                          #{job.id} {job.location}
                        </span>
                        <span className="ml-auto mr-1 h-2 w-2 shrink-0 rounded-full border border-white bg-white/90" />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
