"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const steps = [
  ["Understand", "Share your background, goal, and resume. Aaroh treats the resume as evidence, not the whole person."],
  ["Analyze", "A staged review separates what you have shown, what is missing, and what is still uncertain."],
  ["Plan", "You get a roadmap aimed at your gaps, with projects that can become proof of ability."],
  ["Build", "Mark phases complete as you learn and ship. The plan stays attached to your profile."],
  ["Grow", "Come back to the consultant when the goal, the schedule, or the evidence changes."],
];

export function WatchDemo({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger className={className}>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">How a session with Aaroh works</DialogTitle>
        </DialogHeader>
        <ol className="space-y-4">
          {steps.map(([title, copy], index) => (
            <li key={title} className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
                {index + 1}
              </span>
              <span>
                <span className="block font-medium">{title}</span>
                <span className="text-muted-foreground">{copy}</span>
              </span>
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}
