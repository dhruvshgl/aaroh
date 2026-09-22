"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { signOut } from "@/auth";
import { regenerateRoadmap, startAnalysis } from "@/lib/ai/run-analysis";
import { deleteObject } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { adjustPlanSchema, backgroundSchema, goalsSchema, splitList } from "@/lib/validation";
import { RateLimitError } from "@/lib/rate-limit";

export async function beginAnalysis(_formData?: FormData) {
  const user = await requireUser();
  if (!user.profile?.onboardingComplete) redirect("/onboarding");
  try {
    const analysis = await startAnalysis(user.id);
    redirect(`/analysis/${analysis.id}`);
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof RateLimitError) {
      redirect(`/dashboard?notice=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }
}

export async function completePhase(phaseId: string) {
  const user = await requireUser();
  const phase = await prisma.roadmapPhase.findFirst({
    where: { id: phaseId, roadmap: { userId: user.id, isCurrent: true } },
  });
  if (!phase) return;
  await prisma.roadmapPhase.update({
    where: { id: phase.id },
    data: { completedAt: phase.completedAt ? null : new Date() },
  });
  revalidatePath("/dashboard/roadmap");
  revalidatePath("/dashboard");
}

export async function updateProjectStatus(projectId: string, status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED") {
  const user = await requireUser();
  const project = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } });
  if (!project) return { error: "Project not found." };
  await prisma.project.update({
    where: { id: project.id },
    data: {
      status,
      startedAt: status === "IN_PROGRESS" && !project.startedAt ? new Date() : project.startedAt,
      completedAt: status === "COMPLETED" ? new Date() : null,
    },
  });
  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${project.id}`);
  return { ok: true };
}

export async function adjustPlan(_: { error?: string; ok?: boolean } | null, formData: FormData) {
  const user = await requireUser();
  const parsed = adjustPlanSchema.safeParse({
    hoursPerWeek: formData.get("hoursPerWeek"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the plan details." };
  }
  try {
    await regenerateRoadmap(user.id, parsed.data.hoursPerWeek, parsed.data.notes);
  } catch (error) {
    if (error instanceof RateLimitError) return { error: error.message };
    const message = error instanceof Error ? error.message : "The roadmap could not be rebuilt.";
    return { error: message };
  }
  revalidatePath("/dashboard/roadmap");
  revalidatePath("/dashboard/projects");
  return { ok: true };
}

export async function saveSettings(_: { error?: string; ok?: boolean } | null, formData: FormData) {
  const user = await requireUser();
  const background = backgroundSchema.safeParse({
    currentRole: formData.get("currentRole"),
    yearsOfExperience: formData.get("yearsOfExperience"),
    degree: formData.get("degree"),
    field: formData.get("field"),
    institution: formData.get("institution"),
    graduationYear: formData.get("graduationYear"),
    industry: formData.get("industry"),
    region: formData.get("region"),
  });
  const goals = goalsSchema.safeParse({
    goalText: formData.get("goalText"),
    timeframe: formData.get("timeframe"),
    targetEnvironment: formData.get("targetEnvironment"),
  });
  if (!background.success) return { error: background.error.issues[0]?.message ?? "Check your background." };
  if (!goals.success) return { error: goals.error.issues[0]?.message ?? "Check your goal." };
  if (!user.profile) return { error: "Profile missing." };

  const skills = splitList(String(formData.get("skills") ?? ""));
  if (!skills.length) return { error: "Add at least one skill." };
  const interests = splitList(String(formData.get("interests") ?? ""));

  await prisma.$transaction(async (tx) => {
    await tx.careerProfile.update({
      where: { id: user.profile!.id },
      data: {
        currentRole: background.data.currentRole,
        yearsOfExperience: background.data.yearsOfExperience,
        industry: background.data.industry,
        region: background.data.region,
        goalText: goals.data.goalText,
        timeframe: goals.data.timeframe,
        targetEnvironment: goals.data.targetEnvironment,
        enjoys: String(formData.get("enjoys") ?? "") || null,
        dislikes: String(formData.get("dislikes") ?? "") || null,
        currentLearning: String(formData.get("currentLearning") ?? "") || null,
        careerConcern: String(formData.get("careerConcern") ?? "") || null,
        anythingElse: String(formData.get("anythingElse") ?? "") || null,
        interests,
      },
    });
    await tx.education.deleteMany({ where: { profileId: user.profile!.id } });
    if (background.data.degree || background.data.institution) {
      await tx.education.create({
        data: {
          profileId: user.profile!.id,
          degree: background.data.degree || "Not specified",
          field: background.data.field,
          institution: background.data.institution,
          graduationYear: background.data.graduationYear ? Number(background.data.graduationYear) : null,
        },
      });
    }
    await tx.skill.deleteMany({ where: { profileId: user.profile!.id } });
    await tx.skill.createMany({
      data: skills.map((name) => ({ profileId: user.profile!.id, name, category: "self_reported" })),
    });
  });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function removeResume(resumeId: string) {
  const user = await requireUser();
  const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId: user.id } });
  if (!resume) return;
  await deleteObject(resume.storageKey).catch(() => undefined);
  await prisma.resume.delete({ where: { id: resume.id } });
  revalidatePath("/settings");
}

export async function deleteAccount() {
  const user = await requireUser();
  const resumes = await prisma.resume.findMany({ where: { userId: user.id } });
  await Promise.all(resumes.map((resume) => deleteObject(resume.storageKey).catch(() => undefined)));
  await prisma.user.delete({ where: { id: user.id } });
  await signOut({ redirectTo: "/" });
}

export async function createConversation(formData?: FormData) {
  const user = await requireUser();
  const raw = formData instanceof FormData ? String(formData.get("title") ?? "") : "";
  const title = raw.trim().slice(0, 80) || "New conversation";
  const conversation = await prisma.conversation.create({
    data: { userId: user.id, title },
  });
  redirect(`/dashboard/chat/${conversation.id}`);
}
