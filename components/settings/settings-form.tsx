"use client";

import { useActionState } from "react";
import { deleteAccount, removeResume, saveSettings } from "@/app/actions/career";
import { Button } from "@/components/ui/button";
import { CONCERNS, ENVIRONMENTS, EXPERIENCE_BANDS, TIMEFRAMES } from "@/lib/constants";

export function SettingsForm({
  values,
  resumes,
}: {
  values: Record<string, string>;
  resumes: { id: string; filename: string }[];
}) {
  const [state, action, pending] = useActionState(saveSettings, null);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-4xl">Settings</h1>
      <p className="mt-2 text-muted-foreground">Update the profile Aaroh uses. A new analysis picks up these changes.</p>
      <form action={action} className="mt-6 space-y-4 rounded-[2rem] border border-border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">Current role<input name="currentRole" defaultValue={values.currentRole} className="field mt-1" required /></label>
          <label className="text-sm">Experience
            <select name="yearsOfExperience" defaultValue={values.yearsOfExperience} className="field mt-1" required>
              {EXPERIENCE_BANDS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-sm">Industry<input name="industry" defaultValue={values.industry} className="field mt-1" /></label>
          <label className="text-sm">Region<input name="region" defaultValue={values.region} className="field mt-1" /></label>
          <label className="text-sm">Degree<input name="degree" defaultValue={values.degree} className="field mt-1" /></label>
          <label className="text-sm">Field<input name="field" defaultValue={values.field} className="field mt-1" /></label>
          <label className="text-sm">Institution<input name="institution" defaultValue={values.institution} className="field mt-1" /></label>
          <label className="text-sm">Graduation year<input name="graduationYear" defaultValue={values.graduationYear} className="field mt-1" /></label>
        </div>
        <label className="block text-sm">Career goal<textarea name="goalText" defaultValue={values.goalText} className="field mt-1" required /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">Timeframe
            <select name="timeframe" defaultValue={values.timeframe} className="field mt-1" required>
              {TIMEFRAMES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-sm">Environment
            <select name="targetEnvironment" defaultValue={values.targetEnvironment} className="field mt-1" required>
              {ENVIRONMENTS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
        <label className="block text-sm">Skills<input name="skills" defaultValue={values.skills} className="field mt-1" required /></label>
        <label className="block text-sm">Interests<input name="interests" defaultValue={values.interests} className="field mt-1" /></label>
        <label className="block text-sm">What you enjoy<textarea name="enjoys" defaultValue={values.enjoys} className="field mt-1" /></label>
        <label className="block text-sm">What you dislike<textarea name="dislikes" defaultValue={values.dislikes} className="field mt-1" /></label>
        <label className="block text-sm">Currently learning<input name="currentLearning" defaultValue={values.currentLearning} className="field mt-1" /></label>
        <label className="block text-sm">Biggest concern
          <select name="careerConcern" defaultValue={values.careerConcern} className="field mt-1">
            <option value="">Choose one</option>
            {CONCERNS.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="block text-sm">Anything else<textarea name="anythingElse" defaultValue={values.anythingElse} className="field mt-1" /></label>
        {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        {state?.ok ? <p className="text-sm text-primary">Profile saved.</p> : null}
        <Button type="submit" disabled={pending} className="h-11 rounded-full">{pending ? "Saving…" : "Save profile"}</Button>
      </form>

      <section className="mt-8 rounded-[2rem] border border-border bg-card p-5">
        <h2 className="text-2xl">Resume</h2>
        {resumes.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No resume is stored.</p> : null}
        <ul className="mt-3 space-y-2">
          {resumes.map((resume) => (
            <li key={resume.id} className="flex items-center justify-between gap-3 text-sm">
              <span>{resume.filename}</span>
              <form action={removeResume.bind(null, resume.id)}>
                <Button type="submit" variant="outline" className="rounded-full">Delete</Button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-[2rem] border border-destructive/30 bg-card p-5">
        <h2 className="text-2xl">Delete account</h2>
        <p className="mt-2 text-sm text-muted-foreground">This removes your profile, resumes, reports, roadmap, and conversations.</p>
        <form action={deleteAccount} className="mt-4">
          <Button type="submit" variant="destructive" className="rounded-full">Delete my account</Button>
        </form>
      </section>
    </div>
  );
}
