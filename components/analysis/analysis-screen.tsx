"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MountainScene } from "@/components/brand/mountain";
import { Button } from "@/components/ui/button";
import { ANALYSIS_GROUPS } from "@/lib/constants";

type StatusPayload = {
  status: string;
  error?: string | null;
  groups: { group: string; label: string; status: string }[];
};

export function AnalysisScreen({ analysisId, initial }: { analysisId: string; initial: StatusPayload }) {
  const router = useRouter();
  const [payload, setPayload] = useState(initial);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (payload.status === "completed") {
      router.push("/dashboard/report");
      router.refresh();
      return;
    }
    if (payload.status === "failed") return;
    const timer = setInterval(async () => {
      const response = await fetch(`/api/analysis/${analysisId}/status`);
      if (!response.ok) return;
      const next = (await response.json()) as StatusPayload;
      setPayload(next);
    }, 2000);
    return () => clearInterval(timer);
  }, [analysisId, payload.status, router]);

  async function retry() {
    setRetrying(true);
    await fetch(`/api/analysis/${analysisId}`, { method: "POST" });
    setPayload((current) => ({ ...current, status: "processing", error: null }));
    setRetrying(false);
  }

  return (
    <div className="relative min-h-dvh">
      <div className="absolute inset-0">
        <MountainScene dark />
      </div>
      <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-5 py-16 text-white">
        <p className="text-sm tracking-[0.18em] text-[#e7d3a8] uppercase">Aaroh</p>
        <h1 className="mt-3 text-5xl text-white">Analyzing your profile…</h1>
        <p className="mt-3 text-white/75">This may take a few moments. The steps below are the real stages, not a guessed percentage.</p>
        <ul className="mt-8 space-y-3">
          {ANALYSIS_GROUPS.map((group) => {
            const state = payload.groups.find((item) => item.group === group.key)?.status ?? "pending";
            return (
              <li key={group.key} className="flex items-center gap-3 text-sm">
                <span className={`grid size-5 place-items-center rounded-full border ${state === "completed" ? "border-[#d7c4a4] bg-[#d7c4a4] text-[#163028]" : "border-white/40"}`}>
                  {state === "completed" ? "✓" : state === "skipped" ? "–" : state === "failed" ? "!" : ""}
                </span>
                <span className={state === "pending" ? "text-white/55" : "text-white"}>{group.label}</span>
              </li>
            );
          })}
        </ul>
        {payload.status === "failed" ? (
          <div className="mt-8 rounded-3xl bg-black/30 p-4">
            <p className="text-sm text-white/85">{payload.error || "The analysis stopped before it finished."}</p>
            <Button onClick={() => void retry()} disabled={retrying} className="mt-4 h-11 rounded-full bg-white text-primary hover:bg-white/90">
              {retrying ? "Retrying…" : "Retry analysis"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
