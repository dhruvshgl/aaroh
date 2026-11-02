"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Loader2,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  markResumeReady,
  saveAdditional,
  saveBackground,
  saveGoals,
  skipResume,
} from "@/app/actions/onboarding";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { Field } from "@/components/ui/field";
import { Stepper } from "@/components/ui/stepper";
import { TagInput } from "@/components/ui/tag-input";
import {
  CONCERNS,
  ENVIRONMENTS,
  EXPERIENCE_BANDS,
  MAX_RESUME_BYTES,
  SKILL_SUGGESTIONS,
  TIMEFRAMES,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

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

type ResumeInfo = { id: string; filename: string; sizeBytes: number; wordCount?: number | null };
type StepState = { error?: string; ok?: boolean } | null;
type Errors = Record<string, string | undefined>;

const steps = [
  { key: "background", label: "Background" },
  { key: "goals", label: "Goals" },
  { key: "resume", label: "Resume" },
  { key: "additional", label: "Details" },
];
const minutesLeft = [4, 3, 2, 1];

const GOAL_EXAMPLES = [
  "Become an AI engineer at a product company within a year",
  "Move from my current role into data analysis",
  "I'm not sure yet. Help me find a direction that fits my strengths",
];

const INTEREST_SUGGESTIONS = ["AI", "Product development", "Design", "Data", "Startups", "Open source"];

function str(data: FormData, key: string) {
  return String(data.get(key) ?? "").trim();
}

function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** After validation renders, move focus to the first field with an inline error. */
function revealFirstError(formId: string) {
  requestAnimationFrame(() => {
    const alert = document.getElementById(formId)?.querySelector('[role="alert"]');
    const control = alert?.parentElement?.querySelector<HTMLElement>('input:not([type="hidden"]), textarea');
    control?.focus();
    alert?.scrollIntoView({ block: "center", behavior: "smooth" });
  });
}

export function OnboardingWizard({ profile, resume }: { profile: Profile; resume: ResumeInfo | null }) {
  const router = useRouter();
  const initialIndex = Math.max(0, steps.findIndex((item) => item.key === profile.onboardingStep));
  const [index, setIndex] = useState(initialIndex);
  const [furthest, setFurthest] = useState(initialIndex);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [summary, setSummary] = useState({
    currentRole: profile.currentRole ?? "",
    yearsOfExperience: profile.yearsOfExperience ?? "",
    goalText: profile.goalText ?? "",
    timeframe: profile.timeframe ?? "",
    targetEnvironment: profile.targetEnvironment ?? "",
  });

  const [bgErrors, setBgErrors] = useState<Errors>({});
  const [goalErrors, setGoalErrors] = useState<Errors>({});
  const [detailErrors, setDetailErrors] = useState<Errors>({});
  const [goalText, setGoalText] = useState(profile.goalText ?? "");
  const [skills, setSkills] = useState(profile.skills);
  const [interests, setInterests] = useState(profile.interests);

  const [file, setFile] = useState<ResumeInfo | null>(resume);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [resumeBusy, setResumeBusy] = useState<"skip" | "next" | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const top = useRef<HTMLDivElement>(null);

  const wordCount = file && resume && resume.id === file.id ? resume.wordCount : null;

  function goTo(next: number, saved = false) {
    setIndex(next);
    setFurthest((current) => Math.max(current, next));
    if (saved) setSavedAt(Date.now());
    top.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  const [bgState, bgAction, bgPending] = useActionState(async (prev: StepState, data: FormData) => {
    const errors: Errors = {};
    if (str(data, "currentRole").length < 2) errors.currentRole = "Add your current role, for example “Student” or “Software Engineer”.";
    if (!str(data, "yearsOfExperience")) errors.yearsOfExperience = "Choose the band that fits best.";
    const year = str(data, "graduationYear");
    if (year && (!/^\d{4}$/.test(year) || Number(year) < 1950 || Number(year) > 2035)) {
      errors.graduationYear = "Enter a four-digit year between 1950 and 2035.";
    }
    setBgErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      revealFirstError("step-background");
      return prev;
    }
    const result = await saveBackground(prev, data);
    if (result?.ok) {
      setSummary((current) => ({
        ...current,
        currentRole: str(data, "currentRole"),
        yearsOfExperience: str(data, "yearsOfExperience"),
      }));
      goTo(1, true);
    }
    return result;
  }, null);

  const [goalState, goalAction, goalPending] = useActionState(async (prev: StepState, data: FormData) => {
    const errors: Errors = {};
    if (str(data, "goalText").length < 3) errors.goalText = "Tell Aaroh what you want, even if you're unsure. Tap an example below to start.";
    if (!str(data, "timeframe")) errors.timeframe = "Choose a timeframe.";
    if (!str(data, "targetEnvironment")) errors.targetEnvironment = "Choose where you'd like to work.";
    setGoalErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      revealFirstError("step-goals");
      return prev;
    }
    const result = await saveGoals(prev, data);
    if (result?.ok) {
      setSummary((current) => ({
        ...current,
        goalText: str(data, "goalText"),
        timeframe: str(data, "timeframe"),
        targetEnvironment: str(data, "targetEnvironment"),
      }));
      goTo(2, true);
    }
    return result;
  }, null);

  const [detailState, detailAction, detailPending] = useActionState(async (prev: StepState, data: FormData) => {
    const errors: Errors = {};
    if (!str(data, "skills")) errors.skills = "Add at least one skill. Pick from the suggestions if that's easier.";
    if (!str(data, "careerConcern")) errors.careerConcern = "Choose the concern that feels closest.";
    setDetailErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      revealFirstError("step-additional");
      return prev;
    }
    return saveAdditional(prev, data);
  }, null);

  function upload(selected: File) {
    setUploadError(null);
    const lower = selected.name.toLowerCase();
    if (!lower.endsWith(".pdf") && !lower.endsWith(".docx")) {
      setUploadError("Upload a PDF or DOCX file.");
      return;
    }
    if (selected.size > MAX_RESUME_BYTES) {
      setUploadError("Resume files need to be under 10MB.");
      return;
    }
    const body = new FormData();
    body.set("file", selected);
    const request = new XMLHttpRequest();
    request.open("POST", "/api/resume/upload");
    request.responseType = "json";
    setUploadProgress(0);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) setUploadProgress(Math.round((event.loaded / event.total) * 90));
    };
    request.onload = () => {
      setUploadProgress(null);
      const data = (request.response ?? {}) as { error?: string; resumeId?: string; filename?: string; sizeBytes?: number };
      if (request.status < 200 || request.status >= 300 || !data.resumeId) {
        setUploadError(data.error ?? "The upload failed. Try again.");
        return;
      }
      setFile({ id: data.resumeId, filename: data.filename ?? selected.name, sizeBytes: data.sizeBytes ?? selected.size });
      toast.success("Resume uploaded", { description: "Aaroh will read it as evidence." });
      router.refresh();
    };
    request.onerror = () => {
      setUploadProgress(null);
      setUploadError("The upload failed. Check your connection and try again.");
    };
    request.send(body);
  }

  const current = steps[index];
  const uploading = uploadProgress !== null;

  return (
    <div className="min-h-dvh bg-background pb-8" ref={top}>
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-5">
        <Logo compact />
        <div className="flex items-center gap-3 text-small text-muted-foreground">
          <span aria-live="polite" className="flex items-center gap-1">
            {savedAt ? (
              <>
                <Check className="size-4 text-success" aria-hidden="true" />
                <span>Saved</span>
              </>
            ) : null}
          </span>
          <span className="hidden sm:inline">
            Step {index + 1} of {steps.length} · about {minutesLeft[index]} {minutesLeft[index] === 1 ? "minute" : "minutes"} left
          </span>
          <span className="sm:hidden">
            {index + 1}/{steps.length}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4">
        <nav aria-label="Onboarding progress" className="mb-6">
          <Stepper steps={steps} current={index} furthest={furthest} onSelect={(next) => goTo(next)} />
          <p className="mt-1 text-center text-caption text-muted-foreground sm:hidden">
            About {minutesLeft[index]} {minutesLeft[index] === 1 ? "minute" : "minutes"} left
          </p>
        </nav>

        {/* Step 1: background. All steps stay mounted so answers survive going Back. */}
        <form id="step-background" action={bgAction} noValidate hidden={current.key !== "background"} className="surface animate-fade-up p-5 sm:p-8">
          <h1 className="text-h1">Your background</h1>
          <p className="mt-2 text-muted-foreground">This is the part a resume often leaves out, or leaves stale.</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field id="currentRole" label="Current role" error={bgErrors.currentRole} className="sm:col-span-2">
              <input
                id="currentRole"
                name="currentRole"
                defaultValue={profile.currentRole ?? ""}
                className="field"
                placeholder="Student, Software Engineer, Designer…"
                autoComplete="organization-title"
                aria-invalid={bgErrors.currentRole ? true : undefined}
                aria-describedby={bgErrors.currentRole ? "currentRole-error" : undefined}
              />
            </Field>
            <div className="sm:col-span-2">
              <ChoiceGroup
                name="yearsOfExperience"
                label="Years of experience"
                options={EXPERIENCE_BANDS}
                defaultValue={profile.yearsOfExperience}
                error={bgErrors.yearsOfExperience}
                required
              />
            </div>
            <Field id="degree" label="Degree" optional>
              <input id="degree" name="degree" defaultValue={profile.degree} className="field" placeholder="B.Tech" />
            </Field>
            <Field id="field" label="Field of study" optional>
              <input id="field" name="field" defaultValue={profile.field} className="field" placeholder="Computer Science" />
            </Field>
            <Field id="institution" label="Institution" optional>
              <input id="institution" name="institution" defaultValue={profile.institution} className="field" />
            </Field>
            <Field id="graduationYear" label="Graduation year" optional error={bgErrors.graduationYear}>
              <input
                id="graduationYear"
                name="graduationYear"
                inputMode="numeric"
                maxLength={4}
                defaultValue={profile.graduationYear}
                className="field"
                placeholder="2026"
                aria-invalid={bgErrors.graduationYear ? true : undefined}
                aria-describedby={bgErrors.graduationYear ? "graduationYear-error" : undefined}
              />
            </Field>
            <Field id="industry" label="Current industry" optional>
              <input id="industry" name="industry" defaultValue={profile.industry ?? ""} className="field" placeholder="Fintech, education…" />
            </Field>
            <Field id="region" label="Country or region" optional>
              <input id="region" name="region" defaultValue={profile.region ?? ""} className="field" placeholder="India" autoComplete="country-name" />
            </Field>
          </div>
          <ServerError message={bgState?.error} />
          <StepFooter>
            <span className="hidden sm:block" />
            <Button type="submit" disabled={bgPending} size="pill" className="h-12 flex-1 sm:flex-none sm:px-8">
              {bgPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {bgPending ? "Saving…" : "Continue"}
              {bgPending ? null : <ArrowRight aria-hidden="true" />}
            </Button>
          </StepFooter>
        </form>

        {/* Step 2: goals */}
        <form id="step-goals" action={goalAction} noValidate hidden={current.key !== "goals"} className="surface animate-fade-up p-5 sm:p-8">
          <h1 className="text-h1">Where do you want to go?</h1>
          <p className="mt-2 text-muted-foreground">A specific role, a broad direction, or “I don’t know yet” all work.</p>
          <div className="mt-6 space-y-6">
            <Field id="goalText" label="What do you want to become?" error={goalErrors.goalText}>
              <textarea
                id="goalText"
                name="goalText"
                value={goalText}
                onChange={(event) => setGoalText(event.target.value)}
                maxLength={500}
                className="field"
                placeholder="I want to become an AI engineer at a product company."
                aria-invalid={goalErrors.goalText ? true : undefined}
                aria-describedby={goalErrors.goalText ? "goalText-error" : undefined}
              />
            </Field>
            <div className="-mt-3">
              <p className="text-caption text-muted-foreground">Need a starting point? Tap one to fill it in, then make it yours.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {GOAL_EXAMPLES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setGoalText(example)}
                    className="min-h-9 rounded-full border border-dashed border-border px-3 py-1.5 text-left text-caption text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
            <ChoiceGroup name="timeframe" label="Career timeframe" options={TIMEFRAMES} defaultValue={profile.timeframe} error={goalErrors.timeframe} required />
            <ChoiceGroup
              name="targetEnvironment"
              label="Where would you like to work?"
              options={ENVIRONMENTS}
              defaultValue={profile.targetEnvironment}
              error={goalErrors.targetEnvironment}
              required
            />
          </div>
          <ServerError message={goalState?.error} />
          <StepFooter>
            <BackButton onClick={() => goTo(0)} />
            <Button type="submit" disabled={goalPending} size="pill" className="h-12 flex-1 sm:flex-none sm:px-8">
              {goalPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {goalPending ? "Saving…" : "Continue"}
              {goalPending ? null : <ArrowRight aria-hidden="true" />}
            </Button>
          </StepFooter>
        </form>

        {/* Step 3: resume */}
        <section hidden={current.key !== "resume"} className="surface animate-fade-up p-5 sm:p-8" aria-labelledby="resume-title">
          <h1 id="resume-title" className="text-h1">Add your resume</h1>
          <p className="mt-2 text-muted-foreground">PDF or DOCX, up to 10MB. Aaroh reads it as evidence of what you have done.</p>

          {file && !uploading ? (
            <div className="mt-6 rounded-card border border-success/30 bg-success-soft p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-card text-success-foreground">
                  <FileText className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{file.filename}</p>
                  <p className="text-small text-muted-foreground">{formatBytes(file.sizeBytes)} · Ready to analyse</p>
                  <p className="mt-2 flex items-center gap-1.5 text-small text-success-foreground" aria-live="polite">
                    <Check className="size-4" aria-hidden="true" />
                    {wordCount ? `We read ${wordCount.toLocaleString()} words from your resume.` : "We read your resume successfully."}
                  </p>
                </div>
                <button
                  type="button"
                  className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-card hover:text-foreground"
                  onClick={() => {
                    setFile(null);
                    if (fileInput.current) fileInput.current.value = "";
                  }}
                  aria-label="Choose a different file"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : (
            <label
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const dropped = event.dataTransfer.files?.[0];
                if (dropped) upload(dropped);
              }}
              className={cn(
                "mt-6 flex cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed px-6 py-12 text-center transition-colors focus-within:ring-3 focus-within:ring-ring/40",
                dragging ? "border-primary bg-primary/5" : "border-border bg-secondary/40 hover:border-primary/40",
                uploading && "pointer-events-none",
              )}
            >
              {uploading ? (
                <>
                  <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
                  <span className="mt-3 font-medium">Uploading and reading your resume…</span>
                  <div
                    role="progressbar"
                    aria-label="Upload progress"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={uploadProgress ?? 0}
                    className="mt-4 h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted"
                  >
                    <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </>
              ) : (
                <>
                  <span className="grid size-14 place-items-center rounded-full bg-card shadow-[var(--shadow-soft)]">
                    <UploadCloud className="size-6 text-primary" aria-hidden="true" />
                  </span>
                  <span className="mt-4 font-medium">{dragging ? "Drop to upload" : "Drag and drop your resume here"}</span>
                  <span className="mt-1 text-small text-muted-foreground">
                    or <span className="font-medium text-primary underline underline-offset-4">choose a file</span>
                  </span>
                </>
              )}
              <input
                ref={fileInput}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                onChange={(event) => {
                  const selected = event.target.files?.[0];
                  if (selected) upload(selected);
                }}
              />
            </label>
          )}
          <ServerError message={uploadError ?? undefined} />

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-4">
              <p className="font-medium">With a resume</p>
              <p className="mt-1 text-small text-muted-foreground">Aaroh can mark skills as facts and see how deep your experience goes.</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="font-medium">Without a resume</p>
              <p className="mt-1 text-small text-muted-foreground">Aaroh relies on your answers and clearly marks where evidence is thin.</p>
            </div>
          </div>

          <StepFooter>
            <BackButton onClick={() => goTo(1)} />
            <div className="flex flex-1 flex-col-reverse gap-3 sm:flex-none sm:flex-row">
              <Button
                type="button"
                variant="outline"
                size="pill"
                className="h-12 bg-card"
                disabled={resumeBusy !== null || uploading}
                onClick={async () => {
                  setResumeBusy("skip");
                  await skipResume();
                  setResumeBusy(null);
                  goTo(3, true);
                }}
              >
                {resumeBusy === "skip" ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                Continue without a resume
              </Button>
              <Button
                type="button"
                size="pill"
                className="h-12 sm:px-8"
                disabled={!file || resumeBusy !== null || uploading}
                onClick={async () => {
                  setResumeBusy("next");
                  const result = await markResumeReady();
                  setResumeBusy(null);
                  if (result && "error" in result && result.error) {
                    setUploadError(result.error);
                    return;
                  }
                  goTo(3, true);
                }}
              >
                {resumeBusy === "next" ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                Continue with resume
                <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          </StepFooter>
        </section>

        {/* Step 4: details + summary */}
        <form id="step-additional" action={detailAction} noValidate hidden={current.key !== "additional"} className="surface animate-fade-up p-5 sm:p-8">
          <h1 className="text-h1">A little more about you</h1>
          <p className="mt-2 text-muted-foreground">More context means more specific guidance. Only skills and your main concern are required.</p>
          <div className="mt-6 space-y-6">
            <TagInput
              name="skills"
              label="Your strongest skills"
              value={skills}
              onChange={(next) => {
                setSkills(next);
                if (next.length) setDetailErrors((current) => ({ ...current, skills: undefined }));
              }}
              suggestions={SKILL_SUGGESTIONS}
              placeholder="React, Python, Communication…"
              error={detailErrors.skills}
              required
            />
            <TagInput
              name="interests"
              label="What are you interested in?"
              value={interests}
              onChange={setInterests}
              suggestions={INTEREST_SUGGESTIONS}
              placeholder="AI, product development…"
            />
            <ChoiceGroup
              name="careerConcern"
              label="Biggest career concern"
              options={CONCERNS}
              defaultValue={profile.careerConcern}
              error={detailErrors.careerConcern}
              required
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="enjoys" label="What do you enjoy working on?" optional>
                <textarea id="enjoys" name="enjoys" defaultValue={profile.enjoys ?? ""} className="field" placeholder="Building interfaces people use every day…" />
              </Field>
              <Field id="dislikes" label="What kind of work do you dislike?" optional>
                <textarea id="dislikes" name="dislikes" defaultValue={profile.dislikes ?? ""} className="field" placeholder="Long stretches without feedback…" />
              </Field>
            </div>
            <Field id="currentLearning" label="What are you currently learning?" optional>
              <input id="currentLearning" name="currentLearning" defaultValue={profile.currentLearning ?? ""} className="field" placeholder="System design, SQL…" />
            </Field>
            <Field id="anythingElse" label="Anything else Aaroh should know?" optional>
              <textarea id="anythingElse" name="anythingElse" defaultValue={profile.anythingElse ?? ""} className="field" placeholder="Constraints, ambitions, a job description you like…" />
            </Field>
          </div>

          <div className="mt-8 rounded-card bg-secondary/60 p-5">
            <p className="flex items-center gap-2 font-medium">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              Here&apos;s what Aaroh will analyse
            </p>
            <dl className="mt-3 grid gap-x-6 gap-y-3 text-small sm:grid-cols-2">
              <SummaryRow label="Current role" value={summary.currentRole} />
              <SummaryRow label="Experience" value={summary.yearsOfExperience} />
              <SummaryRow label="Goal" value={summary.goalText} wide />
              <SummaryRow label="Timeframe" value={summary.timeframe} />
              <SummaryRow label="Environment" value={summary.targetEnvironment} />
              <SummaryRow label="Resume" value={file ? file.filename : "None — Aaroh will rely on your answers"} />
              <SummaryRow label="Skills" value={skills.length ? `${skills.length} added` : "None yet"} />
            </dl>
            <p className="mt-4 text-caption text-muted-foreground">The analysis usually takes about 1–2 minutes. You can change any of this later in Settings.</p>
          </div>

          <ServerError message={detailState?.error} />
          <StepFooter>
            <BackButton onClick={() => goTo(2)} />
            <Button type="submit" disabled={detailPending} size="pill" className="h-12 flex-1 sm:flex-none sm:px-8">
              {detailPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
              {detailPending ? "Starting your analysis…" : "Start my analysis"}
            </Button>
          </StepFooter>
        </form>
      </div>
    </div>
  );
}

function StepFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-5 mt-8 flex items-center justify-between gap-3 border-t border-border bg-card/95 px-5 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
      {children}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" size="pill" className="h-12" onClick={onClick}>
      <ArrowLeft aria-hidden="true" />
      Back
    </Button>
  );
}

function ServerError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-danger-soft px-3 py-2.5 text-small text-danger-foreground">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

function SummaryRow({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value || "Not set"}</dd>
    </div>
  );
}
