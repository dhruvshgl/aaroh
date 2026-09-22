export function reportSummary(input: {
  name: string;
  score: number;
  snapshot: { currentRole?: string; careerGoal?: string; primaryProfile?: string };
  gaps: { skill: string }[];
}) {
  const gaps = input.gaps.slice(0, 3).map((gap) => gap.skill).join(", ");
  return [
    `${input.name}'s Aaroh career summary`,
    input.snapshot.primaryProfile,
    `Current role: ${input.snapshot.currentRole ?? "Not set"}`,
    `Goal: ${input.snapshot.careerGoal ?? "Not set"}`,
    `Alignment estimate: ${input.score}% (not a hiring prediction)`,
    gaps ? `Focus areas: ${gaps}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
