"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  markResumeReady,
  saveAdditional,
  saveBackground,
  saveGoals,
  skipResume,
} from "@/app/actions/onboarding";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  CONCERNS,
  ENVIRONMENTS,
  EXPERIENCE_BANDS,
  SKILL_SUGGESTIONS,
  TIMEFRAMES,
} from "@/lib/constants";

type Profile = {
  currentRole: string | null;
  yearsOfExperience: string | null;
  industry: string | null;
  region: string | null;
  goalText: string | null;
  timeframe: string | null;
  targetEnvironment: string | null;
  enjoys: string | null;
  dislikes: string | null;
  currentLearning: string | null;
  careerConcern: string | null;
  anythingElse: string | null;
  interests: string[];
  skills: string[];
  degree: string;
  field: string;
  institution: string;
  graduationYear: string;
  onboardingStep: string;
};

const steps = [
  { key: "background", label: "Background" },
  { key: "goals", label: "Goals" },
  { key: "resume", label: "Resume" },
  { key: "additional", label: "Details" },
];

function SelectField({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: readonly string[];
  defaultValue?: string | null;
}) {
  return (
    <label className="block text-sm">
      {label}
      <select name={name} defaultValue={defaultValue ?? ""} required className="field mt-1">
        <option value="" disabled>
          Choose one
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function OnboardingWizard({
  profile,
  resume,
}: {
  profile: Profile;
  resume: { id: string; filename: string; sizeBytes: number } | null;
}) {
  const router = useRouter();
  const initial = steps.some((step) => step.key === profile.onboardingStep)
    ? profile.onboardingStep
    : "background";
  const [step, setStep] = useState(initial);
  const [file, setFile] = useState(resume);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [skills, setSkills] = useState(profile.skills.join(", "));
  const [backgroundState, backgroundAction, backgroundPending] = useActionState(saveBackground, null);
  const [goalState, goalAction, goalPending] = useActionState(saveGoals, null);
  useEffect(() => {
    if (backgroundState && "ok" in backgroundState) setStep("goals");
  }, [backgroundState]);
  useEffect(() => {
    if (goalState && "ok" in goalState) setStep("resume");
  }, [goalState]);
  const [detailState, detailAction, detailPending] = useActionState(saveAdditional, null);
  const index = Math.max(0, steps.findIndex((item) => item.key === step));

  async function upload(selected: File) {
    setUploading(true);
    setUploadError(null);
    const body = new FormData();
    body.set("file", selected);
    const response = await fetch("/api/resume/upload", { method: "POST", body });
    const data = await response.json().catch(() => ({}));
    setUploading(false);
    if (!response.ok) {
      setUploadError(data.error ?? "The upload failed.");
      return;
    }
    setFile({ id: data.resumeId, filename: data.filename, sizeBytes: data.sizeBytes ?? selected.size });
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <Logo compact />
        <p className="text-sm text-muted-foreground">
          Step {index + 1} of {steps.length}
        </p>
      </header>
      <div className="mx-auto max-w-3xl px-4">
        <ol className="mb-8 grid grid-cols-4 gap-2 text-center text-xs">
          {steps.map((item, itemIndex) => (
            <li key={item.key}>
              <div className={`mb-2 h-1.5 rounded-full ${itemIndex <= index ? "bg-primary" : "bg-muted"}`} />
              <span className={itemIndex === index ? "font-medium text-primary" : "text-muted-foreground"}>{item.label}</span>
            </li>
          ))}
        </ol>

        {step === "background" ? (
          <form
            action={backgroundAction}
            className="rounded-[2rem] border border-border bg-card p-5 shadow-sm sm:p-8"
          >
            <h1 className="text-4xl">Your background</h1>
            <p className="mt-2 text-muted-foreground">This is the part a resume often leaves out, or leaves stale.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                Current role
                <input name="currentRole" required defaultValue={profile.currentRole ?? ""} className="field mt-1" placeholder="Software Engineer" />
              </label>
              <SelectField name="yearsOfExperience" label="Years of experience" options={EXPERIENCE_BANDS} defaultValue={profile.yearsOfExperience} />
              <label className="block text-sm">
                Current industry
                <input name="industry" defaultValue={profile.industry ?? ""} className="field mt-1" placeholder="Optional" />
              </label>
              <label className="block text-sm">
                Degree
                <input name="degree" defaultValue={profile.degree} className="field mt-1" placeholder="B.Tech" />
              </label>
              <label className="block text-sm">
                Field of study
                <input name="field" defaultValue={profile.field} className="field mt-1" placeholder="Computer Science" />
              </label>
              <label className="block text-sm">
                Institution
                <input name="institution" defaultValue={profile.institution} className="field mt-1" />
              </label>
              <label className="block text-sm">
                Graduation year
                <input name="graduationYear" inputMode="numeric" defaultValue={profile.graduationYear} className="field mt-1" placeholder="2024" />
              </label>
              <label className="block text-sm sm:col-span-2">
                Country or region
                <input name="region" defaultValue={profile.region ?? ""} className="field mt-1" placeholder="India" />
              </label>
            </div>
            {backgroundState?.error ? <p className="mt-3 text-sm text-destructive">{backgroundState.error}</p> : null}
            <Button type="submit" disabled={backgroundPending} className="mt-6 h-12 w-full rounded-full sm:w-auto sm:px-8">
              {backgroundPending ? "Saving…" : "Continue"}
            </Button>
          </form>
        ) : null}

        {step === "goals" ? (
          <form
            action={goalAction}
            className="rounded-[2rem] border border-border bg-card p-5 shadow-sm sm:p-8"
          >
            <h1 className="text-4xl">Where do you want to go?</h1>
            <p className="mt-2 text-muted-foreground">A specific role, a broad direction, or “I don’t know yet” all work.</p>
            <div className="mt-6 space-y-4">
              <label className="block text-sm">
                What do you want to become?
                <textarea name="goalText" required defaultValue={profile.goalText ?? ""} className="field mt-1" placeholder="I want to become an AI engineer at a product company." />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField name="timeframe" label="Career timeframe" options={TIMEFRAMES} defaultValue={profile.timeframe} />
                <SelectField name="targetEnvironment" label="Target environment" options={ENVIRONMENTS} defaultValue={profile.targetEnvironment} />
              </div>
            </div>
            {goalState?.error ? <p className="mt-3 text-sm text-destructive">{goalState.error}</p> : null}
            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" className="h-12 rounded-full" onClick={() => setStep("background")}>
                Back
              </Button>
              <Button type="submit" disabled={goalPending} className="h-12 flex-1 rounded-full">
                {goalPending ? "Saving…" : "Continue"}
              </Button>
            </div>
          </form>
        ) : null}

        {step === "resume" ? (
          <section className="rounded-[2rem] border border-border bg-card p-5 shadow-sm sm:p-8">
            <h1 className="text-4xl">Upload your resume</h1>
            <p className="mt-2 text-muted-foreground">PDF or DOCX, up to 10MB. Aaroh reads it as evidence.</p>
            <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-primary/30 bg-secondary/40 px-6 py-12 text-center">
              <span className="font-medium">Drag and drop your resume here</span>
              <span className="mt-1 text-sm text-muted-foreground">or choose a file</span>
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                onChange={(event) => {
                  const selected = event.target.files?.[0];
                  if (selected) void upload(selected);
                }}
              />
            </label>
            {uploading ? <p className="mt-3 text-sm">Reading your resume…</p> : null}
            {uploadError ? <p className="mt-3 text-sm text-destructive">{uploadError}</p> : null}
            {file ? (
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-border px-4 py-3">
                <div>
                  <p className="font-medium">{file.filename}</p>
                  <p className="text-sm text-muted-foreground">{(file.sizeBytes / (1024 * 1024)).toFixed(1)} MB · Ready to analyze</p>
                </div>
                <button type="button" className="text-sm text-muted-foreground" onClick={() => setFile(null)}>
                  Remove
                </button>
              </div>
            ) : null}
            <div className="mt-6 rounded-2xl bg-secondary px-4 py-3 text-sm">
              No resume? No problem. You can continue and fill in the details yourself. The analysis will say when evidence is thin.
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button type="button" variant="outline" className="h-12 rounded-full" onClick={() => setStep("goals")}>
                Back
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-full"
                onClick={async () => {
                  await skipResume();
                  setStep("additional");
                  router.refresh();
                }}
              >
                Continue without a resume
              </Button>
              <Button
                type="button"
                className="h-12 rounded-full sm:flex-1"
                disabled={!file}
                onClick={async () => {
                  const result = await markResumeReady();
                  if (result && "error" in result && result.error) {
                    setUploadError(result.error);
                    return;
                  }
                  setStep("additional");
                }}
              >
                Next
              </Button>
            </div>
          </section>
        ) : null}

        {step === "additional" ? (
          <form action={detailAction} className="rounded-[2rem] border border-border bg-card p-5 shadow-sm sm:p-8">
            <h1 className="text-4xl">Tell us more about you</h1>
            <p className="mt-2 font-serif text-lg italic text-primary">More context. Better guidance.</p>
            <div className="mt-6 space-y-4">
              <label className="block text-sm">
                Strongest skills, comma separated
                <input name="skills" required value={skills} onChange={(event) => setSkills(event.target.value)} className="field mt-1" placeholder="React, TypeScript, Node.js" />
              </label>
              <div className="flex flex-wrap gap-2">
                {SKILL_SUGGESTIONS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    className="rounded-full border border-border px-3 py-1 text-xs"
                    onClick={() => setSkills((current) => (current.includes(skill) ? current : current ? `${current}, ${skill}` : skill))}
                  >
                    {skill}
                  </button>
                ))}
              </div>
              <label className="block text-sm">
                What are you interested in?
                <input name="interests" defaultValue={profile.interests.join(", ")} className="field mt-1" placeholder="AI, product development, system design" />
              </label>
              <label className="block text-sm">
                What do you enjoy working on?
                <textarea name="enjoys" defaultValue={profile.enjoys ?? ""} className="field mt-1" />
              </label>
              <label className="block text-sm">
                What kind of work do you dislike?
                <textarea name="dislikes" defaultValue={profile.dislikes ?? ""} className="field mt-1" />
              </label>
              <label className="block text-sm">
                What are you currently learning?
                <input name="currentLearning" defaultValue={profile.currentLearning ?? ""} className="field mt-1" />
              </label>
              <SelectField name="careerConcern" label="Biggest career concern" options={CONCERNS} defaultValue={profile.careerConcern} />
              <label className="block text-sm">
                Anything else Aaroh should know?
                <textarea name="anythingElse" defaultValue={profile.anythingElse ?? ""} className="field mt-1" />
              </label>
            </div>
            {detailState?.error ? <p className="mt-3 text-sm text-destructive">{detailState.error}</p> : null}
            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" className="h-12 rounded-full" onClick={() => setStep("resume")}>
                Back
              </Button>
              <Button type="submit" disabled={detailPending} className="h-12 flex-1 rounded-full">
                {detailPending ? "Starting analysis…" : "Analyze my profile"}
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}
