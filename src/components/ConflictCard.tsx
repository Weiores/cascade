import { AlertTriangle, ArrowRight } from "lucide-react";
import type { MaintenanceRequest } from "../lib/types";
import { TypeBadge } from "./badges";
import { PriorityPill } from "./indicators";
import { Button } from "./ui";

export default function ConflictCard({
  request,
  onResolve,
}: {
  request: MaintenanceRequest;
  onResolve: (req: MaintenanceRequest) => void;
}) {
  return (
    <div className="rounded-2xl border border-line-red/30 bg-line-red/[0.04] p-4 transition-colors hover:border-line-red/50">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-line-red/10">
            <AlertTriangle className="h-3.5 w-3.5 text-line-red" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] text-ink/40">#{request.id}</span>
              <TypeBadge type={request.type} />
              <PriorityPill score={request.final_priority} />
            </div>
            <p className="mt-1 text-sm font-semibold leading-snug">{request.title}</p>
            <p className="mt-1 text-xs text-line-red">
              {request.conflict_reason ?? "Unresolved conflict"} · {request.location} · {request.duration_minutes} min
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => onResolve(request)} className="shrink-0 border-line-red/40 text-line-red hover:bg-line-red/5">
          Resolve <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
