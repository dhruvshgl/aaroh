"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BasisChip, DepthChip, SeverityChip } from "@/components/ui/chips";
import { ProgressRing } from "@/components/ui/progress-ring";

const skills = [
  { name: "React", depth: "production" },
  { name: "TypeScript", depth: "practiced" },
  { name: "System design", depth: "listed" },
];

export function SampleReport({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger className={className}>{children}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-card p-5 sm:max-w-xl sm:p-6">
        <DialogHeader>
          <p className="text-caption font-medium tracking-[0.16em] text-primary uppercase">Sample report · illustrative data</p>
          <DialogTitle className="font-serif text-h2">What your Aaroh report looks like</DialogTitle>
          <DialogDescription>
            A shortened example for a frontend developer aiming for a product-company role.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 rounded-xl bg-secondary/60 p-4">
          <ProgressRing value={64} size={96} stroke={9} label="Sample alignment estimate 64 percent" />
          <div>
            <p className="font-medium">64% aligned with Frontend Engineer</p>
            <p className="mt-1 text-caption leading-5 text-muted-foreground">
              An internal estimate, not a prediction of hiring outcomes.
            </p>
          </div>
        </div>

        <div>
          <p className="text-small font-medium">Skills, by depth of evidence</p>
          <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
            {skills.map((skill) => (
              <li key={skill.name} className="flex items-center justify-between gap-3 px-3 py-2.5 text-small">
                {skill.name}
                <DepthChip depth={skill.depth} />
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">System design</p>
            <SeverityChip severity="high" />
            <BasisChip basis="inference" />
          </div>
          <p className="mt-2 text-small text-muted-foreground">
            Product teams expect you to reason about data flow and trade-offs. Your resume lists it, but no project shows it yet.
          </p>
          <p className="mt-3 rounded-lg bg-depth-production-soft px-3 py-2 text-small">
            <span className="font-medium text-primary">Next action · </span>
            Design and document a small real-time feature, then explain its trade-offs in a README.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
