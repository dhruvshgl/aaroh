"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, ChevronDown, Loader2, Minus, RotateCcw } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { MountainScene } from "@/components/brand/mountain";
import { Button, buttonVariants } from "@/components/ui/button";
import { ANALYSIS_GROUPS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type StatusPayload = {
  status: string;
  error?: string | null;
  groups: { group: string; label: string; status: string }[];
};

const GROUP_DETAIL: Record<string, string> = {
  extract: "Reading your resume for roles, projects and skills.",
  skills: "Judging how deep each skill goes: listed, practiced or production.",
  goals: "Turning your goal into the capabilities that role expects.",
  expectations: "Comparing what you have shown with what the role needs.",
  insights: "Writing your report, alternative paths and a roadmap.",
};

export function AnalysisScreen({ analysisId, initial }: { analysisId: string; initial: StatusPayload }) {
  const router = useRouter();
  const [payload, setPayload] = useState(initial);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const announced = useRef("");
  const [announcement, setAnnouncement] = useState("");

  const done = payload.status === "completed";
  const failed = payload.status === "failed";

  useEffect(() => {
    if (done) {
      const timer = setTimeout(() => {
        router.push("/dashboard/report");
        router.refresh();
      }, 1400);
      return () => clearTimeout(timer);
    }
    if (failed) return;
    const timer = setInterval(async () => {
      const response = await fetch(`/api/analysis/${analysisId}/status`).catch(() => null);
      if (!response?.ok) return;
      const next = (await response.json()) as StatusPayload;
      setPayload(next);
      const running = next.groups.find((group) => group.status === "running");
      const label = ANALYSIS_GROUPS.find((group) => group.key === running?.group)?.label;
      const message =
        next.status === "completed"
          ? "Analysis complete. Opening your report."
          : next.status === "failed"
            ? "The analysis stopped before it finished."
            : label
              ? `Now: ${label}.`
              : "";
      if (message && message !== announced.current) {
        announced.current = message;
        setAnnouncement(message);
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [analysisId, done, failed, router]);

  async function retry() {
    setRetrying(true);
    setRetryError(null);
    const response = await fetch(`/api/analysis/${analysisId}`, { method: "POST" }).catch(() => null);
    setRetrying(false);
    if (!response?.ok) {
      const data = await response?.json().catch(() => ({}));
      setRetryError((data as { error?: string })?.error ?? "Retry did not start. Try again in a moment.");
      return;
    }
    const data = (await response.json().catch(() => ({}))) as { analysisId?: string };
    if (data.analysisId && data.analysisId !== analysisId) {
      router.replace(`/analysis/${data.analysisId}`);
      return;
    }
    setPayload((current) => ({ ...current, status: "processing", error: null }));
  }

  return (
    <div className="grid min-h-dvh bg-night text-white lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <p className="sr-only" aria-live="polite" role="status">
        {announcement}
      </p>
      <div className="flex flex-col px-5 py-8 sm:px-10 lg:py-12">
        <Logo light compact href="/dashboard" />
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-10">
          {done ? (
            <div className="animate-fade-up">
              <span className="grid size-14 place-items-center rounded-full bg-sand text-forest">
                <Check className="size-7" aria-hidden="true" />
              </span>
              <h1 className="mt-5 text-h1 text-white sm:text-[2.75rem]">Your report is ready.</h1>
              <p className="mt-3 text-white/80">Opening it now…</p>
            </div>
          ) : (
            <>
              <p className="text-caption font-medium tracking-[0.18em] text-sand-soft uppercase">
                {failed ? "Analysis paused" : "Analysing your profile"}
              </p>
              <h1 className="mt-3 text-h1 text-white sm:text-[2.75rem]">
                {failed ? "Something interrupted the analysis." : "Aaroh is reading your story…"}
              </h1>
              <p className="mt-3 text-white/80">
                {failed
                  ? "Nothing you entered is lost. You can retry now; it picks up from your saved profile."
                  : "This usually takes about 1–2 minutes. These are the real stages, not a guessed percentage."}
              </p>

              <ol className="mt-8 space-y-1">
                {ANALYSIS_GROUPS.map((group) => {
                  const state = payload.groups.find((item) => item.group === group.key)?.status ?? "pending";
                  return (
                    <li
                      key={group.key}
                      className={cn(
                        "flex gap-3 rounded-xl px-3 py-3 transition-colors",
                        state === "running" && "bg-white/[0.07]",
                      )}
                      aria-current={state === "running" ? "step" : undefined}
                    >
                      <StageIcon state={state} />
                      <div className="min-w-0">
                        <p className={cn("text-small font-medium", state === "pending" ? "text-white/60" : "text-white")}>
                          {group.label}
                          <span className="sr-only">
                            {" "}
                            —{" "}
                            {state === "completed" ? "done" : state === "running" ? "in progress" : state === "failed" ? "failed" : state === "skipped" ? "skipped" : "waiting"}
                          </span>
                        </p>
                        <p className={cn("mt-0.5 text-caption", state === "pending" ? "text-white/45" : "text-white/70")}>
                          {state === "skipped" ? "Skipped — no resume was provided." : GROUP_DETAIL[group.key]}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>

              {failed ? (
                <div className="mt-8 animate-fade-up rounded-card bg-white/[0.07] p-5 ring-1 ring-white/10">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      onClick={() => void retry()}
                      disabled={retrying}
                      size="pill"
                      className="h-12 bg-sand-soft px-6 text-forest hover:bg-sand"
                    >
                      {retrying ? <Loader2 className="animate-spin" aria-hidden="true" /> : <RotateCcw aria-hidden="true" />}
                      {retrying ? "Retrying…" : "Retry analysis"}
                    </Button>
                    <Link
                      href="/dashboard"
                      className={cn(buttonVariants({ variant: "ghost", size: "pill" }), "h-12 text-white hover:bg-white/10 hover:text-white")}
                    >
                      Back to dashboard
                    </Link>
                  </div>
                  {retryError ? (
                    <p role="alert" className="mt-3 text-small text-sand-soft">
                      {retryError}
                    </p>
                  ) : null}
                  <details className="group mt-4 text-small">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 text-white/75 hover:text-white">
                      <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                      Details
                    </summary>
                    <p className="mt-1 rounded-lg bg-black/25 px-3 py-2 font-mono text-caption break-words text-white/80">
                      {payload.error || "The analysis stopped before it finished."}
                    </p>
                  </details>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="relative h-48 lg:h-auto" aria-hidden="true">
        <MountainScene dark caption={null} className="absolute inset-0 min-h-0" />
      </div>
    </div>
  );
}

function StageIcon({ state }: { state: string }) {
  const base = "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full";
  if (state === "completed") {
    return (
      <span className={cn(base, "bg-sand text-forest")}>
        <Check className="size-3.5" aria-hidden="true" />
      </span>
    );
  }
  if (state === "running") {
    return (
      <span className={cn(base, "text-sand-soft")}>
        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
      </span>
    );
  }
  if (state === "failed") {
    return (
      <span className={cn(base, "bg-danger text-white")}>
        <AlertCircle className="size-3.5" aria-hidden="true" />
      </span>
    );
  }
  if (state === "skipped") {
    return (
      <span className={cn(base, "border border-white/30 text-white/60")}>
        <Minus className="size-3.5" aria-hidden="true" />
      </span>
    );
  }
  return <span className={cn(base, "border border-white/30")} />;
}
