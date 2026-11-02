import {
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleHelp,
  Compass,
  FileCheck2,
  Lightbulb,
  SignalHigh,
  SignalLow,
  SignalMedium,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ChipTone = "neutral" | "primary" | "success" | "warning" | "danger" | "info" | "gold";

const toneClass: Record<ChipTone, string> = {
  neutral: "bg-secondary text-secondary-foreground ring-border",
  primary: "bg-depth-production-soft text-primary ring-primary/15",
  success: "bg-success-soft text-success-foreground ring-success/20",
  warning: "bg-warning-soft text-warning-foreground ring-warning/25",
  danger: "bg-danger-soft text-danger-foreground ring-danger/20",
  info: "bg-info-soft text-info-foreground ring-info/20",
  gold: "bg-sand-soft/60 text-warning-foreground ring-gold/30",
};

export function Chip({
  tone = "neutral",
  icon: Icon,
  children,
  className,
  title,
}: {
  tone?: ChipTone;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2.5 text-caption font-medium whitespace-nowrap ring-1 ring-inset",
        toneClass[tone],
        className,
      )}
    >
      {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

/* ---------- Trust labels: fact / inference / recommendation / uncertainty ---------- */

export const BASIS = {
  fact: { label: "Fact", tone: "success", icon: FileCheck2, description: "What your resume or your own words actually say." },
  inference: { label: "Inference", tone: "info", icon: Lightbulb, description: "A reasonable reading of the evidence, marked as a reading." },
  recommendation: { label: "Recommendation", tone: "primary", icon: Compass, description: "A suggested next step, and why it is next." },
  uncertain: { label: "Uncertainty", tone: "warning", icon: CircleHelp, description: "Where the evidence is too thin to be sure." },
} as const satisfies Record<string, { label: string; tone: ChipTone; icon: LucideIcon; description: string }>;

export type BasisKey = keyof typeof BASIS;

function basisKey(value: string): BasisKey {
  const v = value.toLowerCase();
  if (v === "fact") return "fact";
  if (v === "inference") return "inference";
  if (v === "recommendation") return "recommendation";
  return "uncertain";
}

export function BasisChip({ basis, className }: { basis: string; className?: string }) {
  const item = BASIS[basisKey(basis)];
  return (
    <Chip tone={item.tone} icon={item.icon} className={className} title={item.description}>
      {item.label}
    </Chip>
  );
}

export function TrustLegend({ className, include = ["fact", "inference", "recommendation", "uncertain"] }: { className?: string; include?: BasisKey[] }) {
  return (
    <div className={cn("rounded-xl border border-border bg-secondary/50 p-3", className)}>
      <p className="text-caption font-medium tracking-wide text-muted-foreground uppercase">How to read the labels</p>
      <dl className="mt-2 grid gap-2 sm:grid-cols-2">
        {include.map((key) => {
          const item = BASIS[key];
          return (
            <div key={key} className="flex items-start gap-2">
              <dt className="shrink-0">
                <BasisChip basis={key} />
              </dt>
              <dd className="text-caption leading-5 text-muted-foreground">{item.description}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

/* ---------- Severity ---------- */

const SEVERITY = {
  low: { label: "Low", tone: "info", icon: SignalLow },
  medium: { label: "Medium", tone: "warning", icon: SignalMedium },
  high: { label: "High", tone: "danger", icon: SignalHigh },
} as const satisfies Record<string, { label: string; tone: ChipTone; icon: LucideIcon }>;

export function SeverityChip({ severity, className }: { severity: string; className?: string }) {
  const key = (severity.toLowerCase() in SEVERITY ? severity.toLowerCase() : "medium") as keyof typeof SEVERITY;
  const item = SEVERITY[key];
  return (
    <Chip tone={item.tone} icon={item.icon} className={className} title={`${item.label} severity gap`}>
      {item.label} severity
    </Chip>
  );
}

/* ---------- Skill depth: listed / practiced / production ---------- */

export const DEPTH = {
  listed: { label: "Listed", level: 1, description: "Named on your resume or profile, without shown use." },
  practiced: { label: "Practiced", level: 2, description: "Used in projects, coursework or real tasks." },
  production: { label: "Production", level: 3, description: "Used to ship something real that others relied on." },
} as const;

export function DepthChip({ depth, className }: { depth: string; className?: string }) {
  const key = (depth.toLowerCase() in DEPTH ? depth.toLowerCase() : "listed") as keyof typeof DEPTH;
  const item = DEPTH[key];
  const tone =
    key === "production"
      ? "bg-depth-production-soft text-depth-production ring-depth-production/20"
      : key === "practiced"
        ? "bg-depth-practiced-soft text-depth-practiced ring-depth-practiced/20"
        : "bg-depth-listed-soft text-depth-listed ring-border";
  return (
    <span
      title={item.description}
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-caption font-medium whitespace-nowrap ring-1 ring-inset",
        tone,
        className,
      )}
    >
      <span className="flex items-end gap-px" aria-hidden="true">
        {[1, 2, 3].map((bar) => (
          <span
            key={bar}
            className={cn("w-[3px] rounded-sm bg-current", bar <= item.level ? "opacity-100" : "opacity-25")}
            style={{ height: 4 + bar * 2 }}
          />
        ))}
      </span>
      {item.label}
    </span>
  );
}

/* ---------- Project status ---------- */

export const PROJECT_STATUS = {
  NOT_STARTED: { label: "Not started", tone: "neutral", icon: CircleDashed },
  IN_PROGRESS: { label: "In progress", tone: "warning", icon: CircleDot },
  COMPLETED: { label: "Completed", tone: "success", icon: CircleCheck },
} as const satisfies Record<string, { label: string; tone: ChipTone; icon: LucideIcon }>;

export type ProjectStatus = keyof typeof PROJECT_STATUS;

export function StatusChip({ status, className }: { status: ProjectStatus; className?: string }) {
  const item = PROJECT_STATUS[status];
  return (
    <Chip tone={item.tone} icon={item.icon} className={className}>
      {item.label}
    </Chip>
  );
}

/* ---------- Path fit ---------- */

export function FitChip({ label, score, className }: { label: string; score: number; className?: string }) {
  const tone: ChipTone = score >= 75 ? "success" : score >= 60 ? "gold" : "neutral";
  return (
    <Chip tone={tone} className={className}>
      {label}
    </Chip>
  );
}

export function DifficultyMeter({ difficulty, className }: { difficulty: string; className?: string }) {
  const level = difficulty === "high" ? 3 : difficulty === "moderate" ? 2 : 1;
  const label = difficulty === "high" ? "High" : difficulty === "moderate" ? "Moderate" : "Low";
  return (
    <span className={cn("inline-flex items-center gap-2 text-caption text-muted-foreground", className)}>
      <span className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3].map((dot) => (
          <span key={dot} className={cn("h-1.5 w-4 rounded-full", dot <= level ? "bg-gold" : "bg-muted")} />
        ))}
      </span>
      <span>
        <span className="sr-only">Difficulty: </span>
        {label} difficulty
      </span>
    </span>
  );
}
