import assert from "node:assert/strict";
import test from "node:test";
import { scoreAlignment, scorePathFit } from "./alignment";

test("a practiced profile with a specific goal scores higher than an open, high-gap profile", () => {
  const strong = scoreAlignment({
    skills: [
      { depth: "production", relevance: "core" },
      { depth: "practiced", relevance: "core" },
    ],
    yearsOfExperience: "5–10 years",
    experienceRelevance: "high",
    goalSpecificity: "specific",
    evidenceStrength: "high",
    gaps: [{ severity: "low" }],
  });

  const early = scoreAlignment({
    skills: [{ depth: "listed", relevance: "core" }],
    yearsOfExperience: "Student / No experience",
    experienceRelevance: "low",
    goalSpecificity: "open",
    evidenceStrength: "low",
    gaps: [{ severity: "high" }, { severity: "high" }, { severity: "high" }],
  });

  assert.ok(strong.score > early.score);
  assert.ok(strong.score <= 92);
  assert.ok(early.score >= 8);
});

test("critical gaps lower the score without changing skill evidence", () => {
  const base = {
    skills: [{ depth: "practiced" as const, relevance: "core" as const }],
    yearsOfExperience: "2–3 years",
    experienceRelevance: "medium" as const,
    goalSpecificity: "specific" as const,
    evidenceStrength: "medium" as const,
  };
  const lighter = scoreAlignment({ ...base, gaps: [{ severity: "low" }] });
  const heavier = scoreAlignment({
    ...base,
    gaps: [{ severity: "high" }, { severity: "high" }, { severity: "medium" }],
  });
  assert.ok(heavier.score < lighter.score);
  assert.ok(heavier.breakdown.gapPenalty > lighter.breakdown.gapPenalty);
});

test("path fit stays inside the published band and labels the result", () => {
  const strong = scorePathFit({
    skillOverlap: 5,
    interestOverlap: 5,
    experienceTransfer: 4,
    gapBurden: 1,
  });
  const stretch = scorePathFit({
    skillOverlap: 2,
    interestOverlap: 2,
    experienceTransfer: 2,
    gapBurden: 5,
  });
  assert.equal(strong.label, "Strong alignment");
  assert.equal(stretch.label, "Requires additional depth");
  assert.ok(strong.score <= 95 && stretch.score >= 15);
});
