"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { startAnalysis } from "@/lib/ai/run-analysis";
import { RateLimitError } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { additionalSchema, backgroundSchema, goalsSchema, splitList } from "@/lib/validation";

function firstError(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Check the form and try again.";
}

type StepState = { error?: string; ok?: boolean } | null;

export async function saveBackground(_: StepState, formData: FormData): Promise<StepState> {
  const user = await requireUser();
  const parsed = backgroundSchema.safeParse({
    currentRole: formData.get("currentRole"),
    yearsOfExperience: formData.get("yearsOfExperience"),
    degree: formData.get("degree"),
    field: formData.get("field"),
    institution: formData.get("institution"),
    graduationYear: formData.get("graduationYear"),
    industry: formData.get("industry"),
    region: formData.get("region"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const profile = user.profile;
  if (!profile) return { error: "Your profile could not be found." };

  await prisma.$transaction(async (tx) => {
    await tx.careerProfile.update({
      where: { id: profile.id },
      data: {
        currentRole: parsed.data.currentRole,
        yearsOfExperience: parsed.data.yearsOfExperience,
        industry: parsed.data.industry,
        region: parsed.data.region,
        onboardingStep: "goals",
      },
    });
    await tx.education.deleteMany({ where: { profileId: profile.id } });
    if (parsed.data.degree || parsed.data.institution || parsed.data.field) {
      await tx.education.create({
        data: {
          profileId: profile.id,
          degree: parsed.data.degree || "Not specified",
          field: parsed.data.field,
          institution: parsed.data.institution,
          graduationYear: parsed.data.graduationYear ? Number(parsed.data.graduationYear) : null,
        },
      });
    }
  });

  return { ok: true };
}

export async function saveGoals(_: StepState, formData: FormData): Promise<StepState> {
  const user = await requireUser();
  const parsed = goalsSchema.safeParse({
    goalText: formData.get("goalText"),
    timeframe: formData.get("timeframe"),
    targetEnvironment: formData.get("targetEnvironment"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  if (!user.profile) return { error: "Your profile could not be found." };

  await prisma.careerProfile.update({
    where: { id: user.profile.id },
    data: {
      goalText: parsed.data.goalText,
      timeframe: parsed.data.timeframe,
      targetEnvironment: parsed.data.targetEnvironment,
      onboardingStep: "resume",
    },
  });
  return { ok: true };
}

export async function skipResume() {
  const user = await requireUser();
  if (!user.profile) return;
  await prisma.careerProfile.update({
    where: { id: user.profile.id },
    data: { resumeSkipped: true, onboardingStep: "additional" },
  });
}

export async function markResumeReady() {
  const user = await requireUser();
  if (!user.profile) return { error: "Your profile could not be found." };
  const resume = await prisma.resume.findFirst({
    where: { userId: user.id, status: { in: ["COMPLETED", "UPLOADED"] } },
    orderBy: { createdAt: "desc" },
  });
  if (!resume) return { error: "Upload a resume or continue without one." };
  await prisma.careerProfile.update({
    where: { id: user.profile.id },
    data: { resumeSkipped: false, onboardingStep: "additional" },
  });
  return { ok: true };
}

export async function saveAdditional(_: StepState, formData: FormData): Promise<StepState> {
  const user = await requireUser();
  const parsed = additionalSchema.safeParse({
    skills: formData.get("skills"),
    interests: formData.get("interests"),
    enjoys: formData.get("enjoys"),
    dislikes: formData.get("dislikes"),
    currentLearning: formData.get("currentLearning"),
    careerConcern: formData.get("careerConcern"),
    anythingElse: formData.get("anythingElse"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  if (!user.profile) return { error: "Your profile could not be found." };

  const skills = splitList(parsed.data.skills);
  if (!skills.length) return { error: "Add at least one skill." };

  await prisma.$transaction(async (tx) => {
    await tx.careerProfile.update({
      where: { id: user.profile!.id },
      data: {
        enjoys: parsed.data.enjoys,
        dislikes: parsed.data.dislikes,
        currentLearning: parsed.data.currentLearning,
        careerConcern: parsed.data.careerConcern,
        anythingElse: parsed.data.anythingElse,
        interests: splitList(parsed.data.interests),
        onboardingStep: "complete",
        onboardingComplete: true,
      },
    });
    await tx.skill.deleteMany({ where: { profileId: user.profile!.id } });
    await tx.skill.createMany({
      data: skills.map((name) => ({ profileId: user.profile!.id, name, category: "self_reported" })),
    });
  });

  try {
    const analysis = await startAnalysis(user.id);
    redirect(`/analysis/${analysis.id}`);
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof RateLimitError) return { error: error.message };
    throw error;
  }
}
