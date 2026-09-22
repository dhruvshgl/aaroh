import { Prisma } from "@prisma/client";
import { after } from "next/server";
import { ANALYSIS_STAGES, PROMPT_VERSION } from "@/lib/constants";
import { scoreAlignment, scorePathFit } from "@/lib/career/alignment";
import {
  alternativesSchema,
  gapAnalysisSchema,
  goalAnalysisSchema,
  profileNormalizationSchema,
  reportNarrativeSchema,
  resumeExtractionSchema,
  roadmapSchema,
  skillAnalysisSchema,
  type Alternatives,
  type GapAnalysis,
  type GoalAnalysis,
  type ProfileNormalization,
  type ReportNarrative,
  type ResumeExtraction,
  type RoadmapDraft,
  type SkillAnalysis,
} from "@/lib/career/schemas";
import { asUntrusted } from "@/lib/ai/client";
import { tasks } from "@/lib/ai/prompts";
import { runStructured } from "@/lib/ai/structured";
import { prisma } from "@/lib/prisma";
import { json, RateLimitError, consumeRateLimit } from "@/lib/rate-limit";

const STALE_MS = 15 * 60 * 1000;

type ProfileWithRelations = Prisma.CareerProfileGetPayload<{
  include: { education: true; skills: true };
}>;

function profilePayload(profile: ProfileWithRelations) {
  return {
    currentRole: profile.currentRole,
    yearsOfExperience: profile.yearsOfExperience,
    industry: profile.industry,
    region: profile.region,
    education: profile.education,
    skills: profile.skills.map((skill) => skill.name),
    interests: profile.interests,
    enjoys: profile.enjoys,
    dislikes: profile.dislikes,
    currentLearning: profile.currentLearning,
    careerConcern: profile.careerConcern,
    anythingElse: profile.anythingElse,
    goalText: profile.goalText,
    timeframe: profile.timeframe,
    targetEnvironment: profile.targetEnvironment,
    resumeSkipped: profile.resumeSkipped,
  };
}

async function stageOutput<T>(analysisId: string, key: string): Promise<T | null> {
  const stage = await prisma.analysisStage.findUnique({
    where: { analysisId_key: { analysisId, key } },
  });
  return (stage?.output as T | null) ?? null;
}

async function markStage(
  analysisId: string,
  key: string,
  status: "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED",
  extra?: { output?: unknown; error?: string },
) {
  await prisma.analysisStage.update({
    where: { analysisId_key: { analysisId, key } },
    data: {
      status,
      output: extra?.output === undefined ? undefined : json(extra.output),
      error: extra?.error,
      startedAt: status === "RUNNING" ? new Date() : undefined,
      completedAt: status === "COMPLETED" || status === "SKIPPED" ? new Date() : undefined,
    },
  });
  await prisma.analysis.update({
    where: { id: analysisId },
    data: { updatedAt: new Date() },
  });
}

async function persistReport({
  userId,
  analysisId,
  reportId,
  narrative,
  skills,
  gaps,
  goal,
  alternatives,
  roadmap,
  alignment,
}: {
  userId: string;
  analysisId: string;
  reportId?: string;
  narrative: ReportNarrative;
  skills: SkillAnalysis;
  gaps: GapAnalysis;
  goal: GoalAnalysis;
  alternatives: Alternatives;
  roadmap: RoadmapDraft;
  alignment: ReturnType<typeof scoreAlignment>;
}) {
  const opportunities = alternatives.paths.map((path) => {
    const fit = scorePathFit(path);
    return { ...path, fitScore: fit.score, fitLabel: fit.label };
  });

  await prisma.$transaction(async (tx) => {
    const report = reportId
      ? await tx.careerReport.update({
          where: { id: reportId },
          data: {
            snapshot: json(narrative.snapshot),
            strengths: json(skills.strengths),
            gaps: json(gaps),
            skills: json(skills.skills),
            targetCareer: json(goal),
            opportunities: json(opportunities),
            recommendations: json(narrative.recommendations),
            resumeInsights: json(narrative.resumeInsights),
            alignmentScore: alignment.score,
            alignmentBreakdown: json(alignment.breakdown),
            alignmentExplanation: narrative.alignmentExplanation,
          },
        })
      : await tx.careerReport.create({
          data: {
            userId,
            analysisId,
            snapshot: json(narrative.snapshot),
            strengths: json(skills.strengths),
            gaps: json(gaps),
            skills: json(skills.skills),
            targetCareer: json(goal),
            opportunities: json(opportunities),
            recommendations: json(narrative.recommendations),
            resumeInsights: json(narrative.resumeInsights),
            alignmentScore: alignment.score,
            alignmentBreakdown: json(alignment.breakdown),
            alignmentExplanation: narrative.alignmentExplanation,
          },
        });

    await tx.careerPath.deleteMany({ where: { reportId: report.id } });
    await tx.careerPath.createMany({
      data: opportunities.map((path) => ({
        userId,
        reportId: report.id,
        roleName: path.roleName,
        summary: path.summary,
        whyIdentified: path.whyIdentified,
        transferableSkills: json(path.transferableSkills),
        missingSkills: json(path.missingSkills),
        difficulty: path.difficulty,
        nextStep: path.nextStep,
        transitionPath: json(path.transitionSteps),
        experiments: json(path.experiments),
        fitScore: path.fitScore,
        fitLabel: path.fitLabel,
      })),
    });

    if (!reportId) {
      const createdRoadmap = await tx.roadmap.create({
        data: {
          userId,
          reportId: report.id,
          targetRole: goal.targetRole,
          version: 1,
          isCurrent: true,
          phases: {
            create: roadmap.phases.map((phase, index) => ({
              sortOrder: index + 1,
              title: phase.title,
              description: phase.description,
              duration: phase.duration,
              objective: phase.objective,
              skills: json(phase.skills),
              topics: json(phase.topics),
              resources: json(phase.resources),
              evidence: phase.evidence,
            })),
          },
        },
      });
      const projects = roadmap.phases.flatMap((phase) => phase.projects);
      if (projects.length) {
        await tx.project.createMany({
          data: projects.map((project) => ({
            userId,
            roadmapId: createdRoadmap.id,
            title: project.title,
            description: project.description,
            whyItMatters: project.whyItMatters,
            skills: json(project.skills),
            requirements: json(project.requirements),
            architecture: project.architecture,
            expectedOutcome: project.expectedOutcome,
            resumeEvidence: project.resumeEvidence,
          })),
        });
      }
    }
  });
}

export async function executeAnalysis(analysisId: string) {
  const analysis = await prisma.analysis.findUnique({
    where: { id: analysisId },
    include: { stages: true, resume: true },
  });
  if (!analysis) return;
  if (analysis.status === "COMPLETED") return;

  const profile = await prisma.careerProfile.findUnique({
    where: { userId: analysis.userId },
    include: { education: true, skills: true },
  });
  if (!profile) {
    await prisma.analysis.update({
      where: { id: analysisId },
      data: { status: "FAILED", error: "Career profile is missing." },
    });
    return;
  }

  const claim = await prisma.analysis.updateMany({
    where: { id: analysisId, status: { in: ["QUEUED", "FAILED"] } },
    data: {
      status: "PROCESSING",
      startedAt: analysis.startedAt ?? new Date(),
      error: null,
      model: process.env.AI_MODEL || null,
    },
  });
  if (claim.count === 0) return;

  const userContext = profilePayload(profile);
  const resumeText = analysis.resume?.extractedText?.slice(0, 20000) ?? null;

  const done = async (key: string) => {
    const stage = await prisma.analysisStage.findUnique({
      where: { analysisId_key: { analysisId, key } },
    });
    return stage?.status === "COMPLETED" || stage?.status === "SKIPPED";
  };

  try {
    let extraction: ResumeExtraction | null = null;
    if (await done("resume_extraction")) {
      const saved = await stageOutput<ResumeExtraction | { skipped?: boolean }>(
        analysisId,
        "resume_extraction",
      );
      extraction = saved && "summary" in saved ? saved : null;
    } else {
      if (!resumeText) {
        await markStage(analysisId, "resume_extraction", "SKIPPED", {
          output: { skipped: true },
        });
      } else {
        await markStage(analysisId, "resume_extraction", "RUNNING");
        extraction = await runStructured({
          userId: analysis.userId,
          analysisId,
          kind: "resume_extraction",
          schema: resumeExtractionSchema,
          schemaName: "resume_extraction",
          task: tasks.resume,
          payload: asUntrusted("Resume text", { text: resumeText }),
        });
        await markStage(analysisId, "resume_extraction", "COMPLETED", { output: extraction });
        await prisma.resume.update({
          where: { id: analysis.resumeId! },
          data: { parsedData: json(extraction), status: "COMPLETED" },
        });
      }
    }

    const normalized = await done("profile_normalization")
      ? await stageOutput<ProfileNormalization>(analysisId, "profile_normalization")
      : await (async () => {
          await markStage(analysisId, "profile_normalization", "RUNNING");
          const value = await runStructured({
            userId: analysis.userId,
            analysisId,
            kind: "profile_normalization",
            schema: profileNormalizationSchema,
            schemaName: "profile_normalization",
            task: tasks.profile,
            payload: asUntrusted("Profile and resume extraction", {
              profile: userContext,
              resume: extraction,
            }),
          });
          await markStage(analysisId, "profile_normalization", "COMPLETED", { output: value });
          return value;
        })();
    if (!normalized) throw new Error("Profile normalization did not produce a result.");

    const skills = await done("skill_analysis")
      ? await stageOutput<SkillAnalysis>(analysisId, "skill_analysis")
      : await (async () => {
          await markStage(analysisId, "skill_analysis", "RUNNING");
          const value = await runStructured({
            userId: analysis.userId,
            analysisId,
            kind: "skill_analysis",
            schema: skillAnalysisSchema,
            schemaName: "skill_analysis",
            task: tasks.skills,
            payload: asUntrusted("Normalized profile", { profile: userContext, normalized, resume: extraction }),
          });
          await markStage(analysisId, "skill_analysis", "COMPLETED", { output: value });
          return value;
        })();
    if (!skills) throw new Error("Skill analysis did not produce a result.");

    const goal = await done("goal_analysis")
      ? await stageOutput<GoalAnalysis>(analysisId, "goal_analysis")
      : await (async () => {
          await markStage(analysisId, "goal_analysis", "RUNNING");
          const value = await runStructured({
            userId: analysis.userId,
            analysisId,
            kind: "goal_analysis",
            schema: goalAnalysisSchema,
            schemaName: "goal_analysis",
            task: tasks.goal,
            payload: asUntrusted("Career goal and profile", { profile: userContext, normalized, skills }),
          });
          await markStage(analysisId, "goal_analysis", "COMPLETED", { output: value });
          return value;
        })();
    if (!goal) throw new Error("Goal analysis did not produce a result.");

    const gaps = await done("gap_analysis")
      ? await stageOutput<GapAnalysis>(analysisId, "gap_analysis")
      : await (async () => {
          await markStage(analysisId, "gap_analysis", "RUNNING");
          const value = await runStructured({
            userId: analysis.userId,
            analysisId,
            kind: "gap_analysis",
            schema: gapAnalysisSchema,
            schemaName: "gap_analysis",
            task: tasks.gaps,
            payload: asUntrusted("Profile and target role", { profile: userContext, skills, goal }),
          });
          await markStage(analysisId, "gap_analysis", "COMPLETED", { output: value });
          return value;
        })();
    if (!gaps) throw new Error("Gap analysis did not produce a result.");

    const alternatives = await done("alternatives")
      ? await stageOutput<Alternatives>(analysisId, "alternatives")
      : await (async () => {
          await markStage(analysisId, "alternatives", "RUNNING");
          const value = await runStructured({
            userId: analysis.userId,
            analysisId,
            kind: "alternatives",
            schema: alternativesSchema,
            schemaName: "alternative_paths",
            task: tasks.alternatives,
            payload: asUntrusted("Profile, goal, and gaps", { profile: userContext, skills, goal, gaps }),
          });
          await markStage(analysisId, "alternatives", "COMPLETED", { output: value });
          return value;
        })();
    if (!alternatives) throw new Error("Alternative paths did not produce a result.");

    const roadmap = await done("roadmap")
      ? await stageOutput<RoadmapDraft>(analysisId, "roadmap")
      : await (async () => {
          await markStage(analysisId, "roadmap", "RUNNING");
          const value = await runStructured({
            userId: analysis.userId,
            analysisId,
            kind: "roadmap",
            schema: roadmapSchema,
            schemaName: "career_roadmap",
            task: tasks.roadmap,
            payload: asUntrusted("Gaps and timeframe", {
              profile: userContext,
              goal,
              gaps,
              hoursNote: "Sequence the work so the largest gaps come first.",
            }),
          });
          await markStage(analysisId, "roadmap", "COMPLETED", { output: value });
          return value;
        })();
    if (!roadmap) throw new Error("Roadmap generation did not produce a result.");

    const alignment = scoreAlignment({
      skills: skills.skills.map((skill) => ({
        depth: skill.depth,
        relevance: skill.relevance,
      })),
      yearsOfExperience: profile.yearsOfExperience,
      experienceRelevance: normalized.experienceRelevance,
      goalSpecificity: goal.specificity,
      evidenceStrength: normalized.evidenceStrength,
      gaps: gaps.gaps.map((gap) => ({ severity: gap.severity })),
    });

    const narrative = await done("report")
      ? await stageOutput<ReportNarrative>(analysisId, "report")
      : await (async () => {
          await markStage(analysisId, "report", "RUNNING");
          const value = await runStructured({
            userId: analysis.userId,
            analysisId,
            kind: "report",
            schema: reportNarrativeSchema,
            schemaName: "career_report",
            task: tasks.report,
            payload: asUntrusted("Analysis materials and computed alignment", {
              profile: userContext,
              normalized,
              skills,
              goal,
              gaps,
              alignment,
            }),
          });
          await markStage(analysisId, "report", "COMPLETED", { output: value });
          return value;
        })();
    if (!narrative) throw new Error("The career report did not produce a result.");

    const existingReport = await prisma.careerReport.findUnique({ where: { analysisId } });
    await persistReport({
      userId: analysis.userId,
      analysisId,
      reportId: existingReport?.id,
      narrative,
      skills,
      gaps,
      goal,
      alternatives,
      roadmap,
      alignment,
    });

    await prisma.analysis.update({
      where: { id: analysisId },
      data: { status: "COMPLETED", completedAt: new Date(), error: null },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed.";
    const running = await prisma.analysisStage.findFirst({
      where: { analysisId, status: "RUNNING" },
    });
    if (running) {
      await markStage(analysisId, running.key, "FAILED", { error: message.slice(0, 500) });
    }
    await prisma.analysis.update({
      where: { id: analysisId },
      data: { status: "FAILED", error: message.slice(0, 800) },
    });
  }
}

export async function startAnalysis(userId: string) {
  const active = await prisma.analysis.findFirst({
    where: {
      userId,
      status: { in: ["QUEUED", "PROCESSING"] },
      updatedAt: { gt: new Date(Date.now() - STALE_MS) },
    },
    orderBy: { createdAt: "desc" },
  });
  if (active) return active;

  await consumeRateLimit(userId, "analysis");
  const resume = await prisma.resume.findFirst({
    where: { userId, status: { in: ["COMPLETED", "UPLOADED", "PROCESSING"] } },
    orderBy: { createdAt: "desc" },
  });
  const previous = await prisma.analysis.count({ where: { userId } });
  const analysis = await prisma.analysis.create({
    data: {
      userId,
      resumeId: resume?.id,
      promptVersion: PROMPT_VERSION,
      analysisVersion: previous + 1,
      model: process.env.AI_MODEL || null,
      stages: {
        create: ANALYSIS_STAGES.map((stage, index) => ({
          key: stage.key,
          label: stage.label,
          sortOrder: index + 1,
        })),
      },
    },
  });

  after(async () => {
    await executeAnalysis(analysis.id);
  });

  return analysis;
}

export async function retryAnalysis(userId: string, analysisId: string) {
  const analysis = await prisma.analysis.findFirst({
    where: { id: analysisId, userId },
  });
  if (!analysis) return null;
  if (analysis.status === "COMPLETED") return analysis;
  const stale =
    analysis.status === "PROCESSING" &&
    analysis.updatedAt.getTime() < Date.now() - STALE_MS;
  if (analysis.status === "PROCESSING" && !stale) return analysis;

  await prisma.analysisStage.updateMany({
    where: { analysisId, status: "FAILED" },
    data: { status: "PENDING", error: null },
  });
  await prisma.analysis.update({
    where: { id: analysisId },
    data: { status: "QUEUED", error: null },
  });
  after(async () => {
    await executeAnalysis(analysisId);
  });
  return prisma.analysis.findUnique({ where: { id: analysisId } });
}

export function groupStageStatus(
  stages: { key: string; status: string }[],
) {
  return ["extract", "skills", "goals", "expectations", "insights"].map((group) => {
    const keys: string[] = ANALYSIS_STAGES.filter((stage) => stage.group === group).map((stage) => stage.key);
    const rows = stages.filter((stage) => keys.includes(stage.key));
    const status = rows.length > 0 && rows.every((row) => row.status === "SKIPPED")
      ? "skipped"
      : rows.every((row) => row.status === "COMPLETED" || row.status === "SKIPPED")
      ? "completed"
      : rows.some((row) => row.status === "FAILED")
        ? "failed"
        : rows.some((row) => row.status === "RUNNING" || row.status === "COMPLETED" || row.status === "SKIPPED")
          ? "running"
          : "pending";
    return { group, status };
  });
}

export async function regenerateRoadmap(userId: string, hoursPerWeek: number, notes?: string) {
  const report = await prisma.careerReport.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { analysis: true },
  });
  if (!report) throw new Error("Create a career report before adjusting the plan.");

  const profile = await prisma.careerProfile.findUnique({
    where: { userId },
    include: { education: true, skills: true },
  });
  if (!profile) throw new Error("Career profile is missing.");

  await consumeRateLimit(userId, "analysis");
  const roadmap = await runStructured({
    userId,
    analysisId: report.analysisId,
    kind: "roadmap_regeneration",
    schema: roadmapSchema,
    schemaName: "career_roadmap",
    task: tasks.roadmap,
    payload: asUntrusted("Current report and schedule", {
      profile: profilePayload(profile),
      goal: report.targetCareer,
      gaps: report.gaps,
      hoursPerWeek,
      notes: notes ?? null,
    }),
  });

  const current = await prisma.roadmap.findFirst({
    where: { userId, reportId: report.id, isCurrent: true },
    orderBy: { version: "desc" },
  });

  await prisma.$transaction(async (tx) => {
    if (current) {
      await tx.roadmap.update({ where: { id: current.id }, data: { isCurrent: false } });
    }
    const created = await tx.roadmap.create({
      data: {
        userId,
        reportId: report.id,
        targetRole: current?.targetRole || "Target role",
        version: (current?.version ?? 0) + 1,
        isCurrent: true,
        hoursPerWeek,
        notes,
        phases: {
          create: roadmap.phases.map((phase, index) => ({
            sortOrder: index + 1,
            title: phase.title,
            description: phase.description,
            duration: phase.duration,
            objective: phase.objective,
            skills: json(phase.skills),
            topics: json(phase.topics),
            resources: json(phase.resources),
            evidence: phase.evidence,
          })),
        },
      },
    });
    await tx.project.createMany({
      data: roadmap.phases.flatMap((phase) =>
        phase.projects.map((project) => ({
          userId,
          roadmapId: created.id,
          title: project.title,
          description: project.description,
          whyItMatters: project.whyItMatters,
          skills: json(project.skills),
          requirements: json(project.requirements),
          architecture: project.architecture,
          expectedOutcome: project.expectedOutcome,
          resumeEvidence: project.resumeEvidence,
        })),
      ),
    });
  });
}

export { RateLimitError, ProfileNormalization, SkillAnalysis, GoalAnalysis, GapAnalysis };
