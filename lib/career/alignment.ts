export const ALIGNMENT_WEIGHTS = {
  skill: 0.4,
  experience: 0.25,
  goal: 0.15,
  evidence: 0.2,
} as const;

const DEPTH_SCORE = {
  listed: 42,
  practiced: 70,
  production: 94,
} as const;

const EXPERIENCE_BAND_SCORE: Record<string, number> = {
  "Student / No experience": 22,
  "Less than 1 year": 34,
  "1–2 years": 48,
  "2–3 years": 62,
  "3–5 years": 74,
  "5–10 years": 84,
  "10+ years": 90,
};

const RELEVANCE_FACTOR = {
  low: 0.62,
  medium: 0.82,
  high: 1,
} as const;

const GAP_PENALTY = {
  low: 3,
  medium: 7,
  high: 12,
} as const;

export type SkillSignal = {
  depth: keyof typeof DEPTH_SCORE;
  relevance: "core" | "supporting" | "unrelated";
};

export type AlignmentInput = {
  skills: SkillSignal[];
  yearsOfExperience: string | null | undefined;
  experienceRelevance: keyof typeof RELEVANCE_FACTOR;
  goalSpecificity: "specific" | "broad" | "open";
  evidenceStrength: "low" | "medium" | "high";
  gaps: { severity: keyof typeof GAP_PENALTY }[];
};

export type AlignmentResult = {
  score: number;
  breakdown: {
    skill: number;
    experience: number;
    goal: number;
    evidence: number;
    gapPenalty: number;
  };
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number) {
  return Math.round(value);
}

export function scoreAlignment(input: AlignmentInput): AlignmentResult {
  const core = input.skills.filter((skill) => skill.relevance === "core");
  const pool = core.length > 0 ? core : input.skills;
  const skill =
    pool.length > 0
      ? pool.reduce((sum, item) => sum + DEPTH_SCORE[item.depth], 0) / pool.length
      : 30;

  const band = EXPERIENCE_BAND_SCORE[input.yearsOfExperience ?? ""] ?? 40;
  const experience = band * RELEVANCE_FACTOR[input.experienceRelevance];

  const goal =
    input.goalSpecificity === "specific"
      ? 88
      : input.goalSpecificity === "broad"
        ? 64
        : 38;

  const evidence =
    input.evidenceStrength === "high"
      ? 86
      : input.evidenceStrength === "medium"
        ? 68
        : 42;

  const weighted =
    skill * ALIGNMENT_WEIGHTS.skill +
    experience * ALIGNMENT_WEIGHTS.experience +
    goal * ALIGNMENT_WEIGHTS.goal +
    evidence * ALIGNMENT_WEIGHTS.evidence;

  const gapPenalty = Math.min(
    36,
    input.gaps.reduce((sum, gap) => sum + GAP_PENALTY[gap.severity], 0),
  );

  return {
    score: clamp(round(weighted - gapPenalty * 0.45), 8, 92),
    breakdown: {
      skill: round(skill),
      experience: round(experience),
      goal,
      evidence,
      gapPenalty,
    },
  };
}

export type PathFitInput = {
  skillOverlap: number;
  interestOverlap: number;
  experienceTransfer: number;
  gapBurden: number;
};

function clampScale(value: number) {
  if (!Number.isFinite(value)) return 3;
  return clamp(value, 1, 5);
}

export function scorePathFit(input: PathFitInput) {
  const skill = clampScale(input.skillOverlap);
  const interest = clampScale(input.interestOverlap);
  const transfer = clampScale(input.experienceTransfer);
  const burden = clampScale(input.gapBurden);
  const raw =
    ((skill * 0.35 + interest * 0.25 + transfer * 0.25 + (6 - burden) * 0.15) /
      5) *
    100;
  const score = clamp(round(raw), 15, 95);
  const label =
    score >= 75
      ? "Strong alignment"
      : score >= 60
        ? "Potential fit"
        : "Requires additional depth";
  return { score, label };
}

export const ALIGNMENT_DISCLAIMER =
  "This is an internal alignment estimate based on your stated goal, demonstrated skills, experience, and identified gaps. It is not a prediction of hiring outcomes.";
