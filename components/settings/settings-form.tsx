"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, FileText, Loader2, Trash2, TriangleAlert } from "lucide-react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { deleteAccount, removeResume, saveSettings } from "@/app/actions/career";
import { Button, buttonVariants } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { TagInput } from "@/components/ui/tag-input";
import { CONCERNS, ENVIRONMENTS, EXPERIENCE_BANDS, TIMEFRAMES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type ResumeRow = { id: string; filename: string; sizeBytes: number; uploadedAt: string };

function split(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function Section({ id, title, description, children }: { id: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="surface grid gap-6 p-5 sm:p-7 md:grid-cols-[220px_minmax(0,1fr)]">
      <div>
        <h2 id={id} className="text-h2">
          {title}
        </h2>
        <p className="mt-1 text-small text-muted-foreground">{description}</p>
      </div>
      <div className="min-w-0 space-y-5">{children}</div>
    </section>
  );
}

export function SettingsForm({
  values,
  resumes,
  email,
}: {
  values: Record<string, string>;
  resumes: ResumeRow[];
  email: string;
}) {
  const form = useRef<HTMLFormElement>(null);
  const [dirty, setDirty] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [skills, setSkills] = useState(() => split(values.skills));
  const [interests, setInterests] = useState(() => split(values.interests));
  const [skillError, setSkillError] = useState<string>();

  const [state, action, pending] = useActionState(async (prev: { error?: string; ok?: boolean } | null, data: FormData) => {
    if (!String(data.get("skills") ?? "").trim()) {
      setSkillError("Add at least one skill.");
      return prev;
    }
    setSkillError(undefined);
    const result = await saveSettings(prev, data);
    if (result?.ok) {
      setDirty(false);
      toast.success("Profile saved", { description: "Run a new analysis from your report to use these changes." });
    } else if (result?.error) {
      toast.error(result.error);
    }
    return result;
  }, null);

  function discard() {
    setSkills(split(values.skills));
    setInterests(split(values.interests));
    setSkillError(undefined);
    setFormKey((key) => key + 1);
    setDirty(false);
  }

  return (
    <div className="mx-auto max-w-4xl pb-16">
      <PageHeader
        eyebrow="Settings"
        title="Your profile and account"
        description="Aaroh uses this profile for every analysis. Changes apply the next time you run one."
      />

      <form
        key={formKey}
        ref={form}
        action={action}
        noValidate
        onChange={() => setDirty(true)}
        className="mt-6 space-y-4"
      >
        <Section id="profile" title="Profile" description="Where you are today.">
          <Field id="currentRole" label="Current role">
            <input id="currentRole" name="currentRole" defaultValue={values.currentRole} className="field" required />
          </Field>
          <ChoiceGroup name="yearsOfExperience" label="Years of experience" options={EXPERIENCE_BANDS} defaultValue={values.yearsOfExperience} size="sm" required />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="industry" label="Industry" optional>
              <input id="industry" name="industry" defaultValue={values.industry} className="field" />
            </Field>
            <Field id="region" label="Country or region" optional>
              <input id="region" name="region" defaultValue={values.region} className="field" />
            </Field>
            <Field id="degree" label="Degree" optional>
              <input id="degree" name="degree" defaultValue={values.degree} className="field" />
            </Field>
            <Field id="field" label="Field of study" optional>
              <input id="field" name="field" defaultValue={values.field} className="field" />
            </Field>
            <Field id="institution" label="Institution" optional>
              <input id="institution" name="institution" defaultValue={values.institution} className="field" />
            </Field>
            <Field id="graduationYear" label="Graduation year" optional>
              <input id="graduationYear" name="graduationYear" inputMode="numeric" maxLength={4} defaultValue={values.graduationYear} className="field" />
            </Field>
          </div>
        </Section>

        <Section id="goal" title="Career goal" description="Where you want to go, and how soon.">
          <Field id="goalText" label="What do you want to become?">
            <textarea id="goalText" name="goalText" defaultValue={values.goalText} maxLength={500} className="field" required />
          </Field>
          <ChoiceGroup name="timeframe" label="Timeframe" options={TIMEFRAMES} defaultValue={values.timeframe} size="sm" required />
          <ChoiceGroup name="targetEnvironment" label="Target environment" options={ENVIRONMENTS} defaultValue={values.targetEnvironment} size="sm" required />
        </Section>

        <Section id="skills-section" title="Skills and interests" description="What you bring, and what pulls you in.">
          <TagInput
            name="skills"
            label="Strongest skills"
            value={skills}
            onChange={(next) => {
              setSkills(next);
              setDirty(true);
              if (next.length) setSkillError(undefined);
            }}
            error={skillError}
            required
          />
          <TagInput
            name="interests"
            label="Interests"
            value={interests}
            onChange={(next) => {
              setInterests(next);
              setDirty(true);
            }}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="enjoys" label="What you enjoy" optional>
              <textarea id="enjoys" name="enjoys" defaultValue={values.enjoys} className="field" />
            </Field>
            <Field id="dislikes" label="What you dislike" optional>
              <textarea id="dislikes" name="dislikes" defaultValue={values.dislikes} className="field" />
            </Field>
          </div>
          <Field id="currentLearning" label="Currently learning" optional>
            <input id="currentLearning" name="currentLearning" defaultValue={values.currentLearning} className="field" />
          </Field>
          <ChoiceGroup name="careerConcern" label="Biggest concern" options={CONCERNS} defaultValue={values.careerConcern} size="sm" />
          <Field id="anythingElse" label="Anything else" optional>
            <textarea id="anythingElse" name="anythingElse" defaultValue={values.anythingElse} className="field" />
          </Field>
        </Section>

        {state?.error && !dirty ? (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger-soft px-3 py-2.5 text-small text-danger-foreground">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {state.error}
          </p>
        ) : null}

        <div
          className={cn(
            "fixed inset-x-4 bottom-20 z-20 mx-auto max-w-2xl transition-all duration-200 lg:bottom-6 lg:left-60",
            dirty || pending ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
          )}
          aria-hidden={!(dirty || pending)}
        >
          <div className="flex items-center justify-between gap-3 rounded-full bg-primary py-2 pr-2 pl-5 text-primary-foreground shadow-[var(--shadow-raised)]">
            <span className="text-small">{state?.error ? state.error : "You have unsaved changes"}</span>
            <div className="flex shrink-0 items-center gap-1">
              <Button type="button" variant="ghost" size="pill-sm" onClick={discard} disabled={pending} tabIndex={dirty ? 0 : -1} className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
                Discard
              </Button>
              <Button type="submit" size="pill-sm" disabled={pending} tabIndex={dirty || pending ? 0 : -1} className="bg-sand-soft text-forest hover:bg-sand">
                {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                {pending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      </form>

      <div className="mt-4 space-y-4">
        <Section id="resume" title="Resume" description="Files Aaroh reads as evidence.">
          {resumes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-4 text-small text-muted-foreground">
              No resume is stored. Your next analysis will rely on your profile answers.
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {resumes.map((resume) => (
                <li key={resume.id} className="flex items-center gap-3 px-4 py-3">
                  <FileText className="size-5 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-small font-medium">{resume.filename}</p>
                    <p className="text-caption text-muted-foreground">
                      Uploaded {resume.uploadedAt} · {(resume.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                  <RemoveResumeDialog resume={resume} />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section id="account" title="Account" description="Your sign-in and data.">
          <div>
            <p className="text-small font-medium">Email</p>
            <p className="text-small text-muted-foreground">{email || "Not set"}</p>
          </div>
          <div className="rounded-card border border-danger/30 bg-danger-soft/40 p-5">
            <h3 className="flex items-center gap-2 font-serif text-h3 text-danger-foreground">
              <TriangleAlert className="size-5" aria-hidden="true" />
              Danger zone
            </h3>
            <p className="mt-1 text-small text-muted-foreground">
              Deleting your account permanently removes your profile, resumes, reports, roadmap, projects and conversations. This cannot be undone.
            </p>
            <DeleteAccountDialog />
          </div>
        </Section>
      </div>

      <p className="mt-6 text-center text-small text-muted-foreground">
        Want Aaroh to use your changes?{" "}
        <Link href="/dashboard/report" className="font-medium text-primary hover:underline">
          Re-analyse from your report
        </Link>
      </p>
    </div>
  );
}

function SubmitButton({ children, disabled, pendingLabel }: { children: React.ReactNode; disabled?: boolean; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" size="pill-sm" disabled={disabled || pending} className="bg-danger text-white hover:bg-danger/90">
      {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
      {pending ? pendingLabel : children}
    </Button>
  );
}

function RemoveResumeDialog({ resume }: { resume: ResumeRow }) {
  return (
    <Dialog>
      <DialogTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-10 rounded-full text-muted-foreground hover:text-danger-foreground")}
        aria-label={`Remove ${resume.filename}`}
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </DialogTrigger>
      <DialogContent className="rounded-card p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-h2">Remove this resume?</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{resume.filename}</span> will be deleted. Existing reports stay, but future analyses won&apos;t use it.
          </DialogDescription>
        </DialogHeader>
        <form
          action={async () => {
            await removeResume(resume.id);
            toast.success("Resume removed");
          }}
          className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
        >
          <DialogClose render={<Button variant="ghost" size="pill-sm" />}>Cancel</DialogClose>
          <SubmitButton pendingLabel="Removing…">Remove resume</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteAccountDialog() {
  const [confirm, setConfirm] = useState("");
  return (
    <Dialog onOpenChange={(open) => !open && setConfirm("")}>
      <DialogTrigger render={<Button variant="destructive" size="pill-sm" className="mt-4" />}>
        <Trash2 aria-hidden="true" />
        Delete my account
      </DialogTrigger>
      <DialogContent className="rounded-card p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-h2">Delete your account?</DialogTitle>
          <DialogDescription>
            This permanently removes everything Aaroh knows about you: profile, resumes, reports, roadmap, projects and conversations.
          </DialogDescription>
        </DialogHeader>
        <form action={deleteAccount} className="space-y-4">
          <Field id="confirm-delete" label='Type "DELETE" to confirm'>
            <input
              id="confirm-delete"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="field font-mono"
              placeholder="DELETE"
            />
          </Field>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogClose render={<Button variant="ghost" size="pill-sm" />}>Keep my account</DialogClose>
            <SubmitButton disabled={confirm !== "DELETE"} pendingLabel="Deleting…">
              Delete forever
            </SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
