import { CircleDot, Clock, FlaskConical, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type Status = "live" | "demo" | "prototype" | "soon";

const STYLE = {
  live: ["text-good border-good/40 bg-good/10", CircleDot],
  demo: ["text-accent border-accent/40 bg-accent/10", Sparkles],
  prototype: ["text-warn border-warn/40 bg-warn/10", FlaskConical],
  soon: ["text-muted border-border bg-surface-2", Clock],
} as const;

/** Honest maturity label shown on every feature. `label` is the translated text. */
export function StatusLabel({ status, label, className }: { status: Status; label: string; className?: string }) {
  const [cls, Icon] = STYLE[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap", cls, className)}>
      <Icon aria-hidden className="size-3" />
      {label}
    </span>
  );
}
