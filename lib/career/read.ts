import {
  gapAnalysisSchema,
  goalAnalysisSchema,
  reportNarrativeSchema,
  skillAnalysisSchema,
} from "@/lib/career/schemas";

const emptySnapshot = {
  currentRole: "Not set",
  experience: "Not set",
  location: "",
  primaryProfile: "",
  careerGoal: "Not set",
};

export function readSnapshot(value: unknown) {
  const parsed = reportNarrativeSchema.shape.snapshot.safeParse(value);
  return parsed.success ? parsed.data : emptySnapshot;
}

export function readStrengths(value: unknown) {
  const parsed = skillAnalysisSchema.shape.strengths.safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function readSkills(value: unknown) {
  const parsed = skillAnalysisSchema.shape.skills.safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function readGaps(value: unknown) {
  const parsed = gapAnalysisSchema.safeParse(value);
  return parsed.success
    ? parsed.data
    : { gaps: [], alreadyHave: [], needToStrengthen: [], limitedEvidence: [] };
}

export function readGoal(value: unknown) {
  const parsed = goalAnalysisSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function readRecommendations(value: unknown) {
  const parsed = reportNarrativeSchema.shape.recommendations.safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function readInsights(value: unknown) {
  const parsed = reportNarrativeSchema.shape.resumeInsights.safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function readResources(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as { title?: unknown; detail?: unknown };
    if (typeof record.title !== "string") return [];
    return [{ title: record.title, detail: typeof record.detail === "string" ? record.detail : "" }];
  });
}

export function readStringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
