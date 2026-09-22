import { z } from "zod";

const basis = z.enum(["fact", "inference", "uncertain"]);
const depth = z.enum(["listed", "practiced", "production"]);
const relevance = z.enum(["core", "supporting", "unrelated"]);
const source = z.enum(["resume", "self_report", "inference"]);
const severity = z.enum(["low", "medium", "high"]);
const scale = z.number().min(1).max(5);

export const resumeExtractionSchema = z.object({
  summary: z.string(),
  currentRole: z.string().nullable(),
  education: z.array(
    z.object({
      degree: z.string(),
      field: z.string().nullable(),
      institution: z.string().nullable(),
      graduationYear: z.number().nullable(),
    }),
  ),
  experience: z.array(
    z.object({
      title: z.string(),
      organization: z.string().nullable(),
      duration: z.string().nullable(),
      highlights: z.array(z.string()),
    }),
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      skills: z.array(z.string()),
    }),
  ),
  skills: z.array(
    z.object({
      name: z.string(),
      category: z.string(),
      evidence: z.string(),
      depth,
    }),
  ),
  achievements: z.array(z.string()),
  domains: z.array(z.string()),
  facts: z.array(z.string()),
  inferences: z.array(z.string()),
  uncertainties: z.array(z.string()),
});

export const profileNormalizationSchema = z.object({
  professionalSummary: z.string(),
  experiencePattern: z.string(),
  primarySkills: z.array(z.string()),
  secondarySkills: z.array(z.string()),
  interests: z.array(z.string()),
  evidenceStrength: z.enum(["low", "medium", "high"]),
  experienceRelevance: z.enum(["low", "medium", "high"]),
});

export const skillAnalysisSchema = z.object({
  skills: z.array(
    z.object({
      name: z.string(),
      category: z.string(),
      depth,
      relevance,
      source,
      evidence: z.string(),
    }),
  ),
  strengths: z.array(
    z.object({
      title: z.string(),
      evidence: z.string(),
      basis: z.enum(["fact", "inference"]),
    }),
  ),
});

export const goalAnalysisSchema = z.object({
  interpretedGoal: z.string(),
  specificity: z.enum(["specific", "broad", "open"]),
  targetRole: z.string(),
  summary: z.string(),
  technicalFoundations: z.array(z.string()),
  appliedSkills: z.array(z.string()),
  productionSkills: z.array(z.string()),
  professionalCapabilities: z.array(z.string()),
  goalClarityNote: z.string(),
});

export const gapAnalysisSchema = z.object({
  gaps: z.array(
    z.object({
      skill: z.string(),
      whyItMatters: z.string(),
      currentEvidence: z.string(),
      requiredCapability: z.string(),
      severity,
      priority: z.number(),
      recommendedAction: z.string(),
      basis,
    }),
  ),
  alreadyHave: z.array(z.string()),
  needToStrengthen: z.array(z.string()),
  limitedEvidence: z.array(z.string()),
});

export const alternativesSchema = z.object({
  paths: z.array(
    z.object({
      roleName: z.string(),
      summary: z.string(),
      whyIdentified: z.string(),
      transferableSkills: z.array(z.string()),
      missingSkills: z.array(z.string()),
      difficulty: z.enum(["low", "moderate", "high"]),
      nextStep: z.string(),
      transitionSteps: z.array(z.string()),
      experiments: z.array(z.string()),
      skillOverlap: scale,
      interestOverlap: scale,
      experienceTransfer: scale,
      gapBurden: scale,
    }),
  ),
});

const projectSchema = z.object({
  title: z.string(),
  description: z.string(),
  whyItMatters: z.string(),
  skills: z.array(z.string()),
  requirements: z.array(z.string()),
  architecture: z.string(),
  expectedOutcome: z.string(),
  resumeEvidence: z.string(),
});

export const roadmapSchema = z.object({
  phases: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      duration: z.string(),
      objective: z.string(),
      skills: z.array(z.string()),
      topics: z.array(z.string()),
      resources: z.array(z.object({ title: z.string(), detail: z.string() })),
      evidence: z.string(),
      projects: z.array(projectSchema),
    }),
  ),
});

export const reportNarrativeSchema = z.object({
  snapshot: z.object({
    currentRole: z.string(),
    experience: z.string(),
    location: z.string(),
    primaryProfile: z.string(),
    careerGoal: z.string(),
  }),
  recommendations: z.array(z.object({ title: z.string(), detail: z.string() })),
  resumeInsights: z.array(
    z.object({
      title: z.string(),
      detail: z.string(),
      basis: z.enum(["fact", "inference", "uncertain"]),
    }),
  ),
  alignmentExplanation: z.string(),
});

export type ResumeExtraction = z.infer<typeof resumeExtractionSchema>;
export type ProfileNormalization = z.infer<typeof profileNormalizationSchema>;
export type SkillAnalysis = z.infer<typeof skillAnalysisSchema>;
export type GoalAnalysis = z.infer<typeof goalAnalysisSchema>;
export type GapAnalysis = z.infer<typeof gapAnalysisSchema>;
export type Alternatives = z.infer<typeof alternativesSchema>;
export type RoadmapDraft = z.infer<typeof roadmapSchema>;
export type ReportNarrative = z.infer<typeof reportNarrativeSchema>;
