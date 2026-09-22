export const PROMPT_VERSION = 1;

export const EXPERIENCE_BANDS = [
  "Student / No experience",
  "Less than 1 year",
  "1–2 years",
  "2–3 years",
  "3–5 years",
  "5–10 years",
  "10+ years",
] as const;

export const TIMEFRAMES = [
  "3–6 months",
  "6–12 months",
  "1–2 years",
  "2+ years",
  "Not sure",
] as const;

export const ENVIRONMENTS = [
  "Startup",
  "Product company",
  "Enterprise",
  "Research",
  "Freelance",
  "Entrepreneurship",
  "Not sure",
] as const;

export const CONCERNS = [
  "Don't know what to learn",
  "Don't know which role fits me",
  "Can't get interviews",
  "Want to switch careers",
  "Want faster growth",
  "Need better technical skills",
] as const;

export const ROLE_SUGGESTIONS = [
  "Student",
  "Software Engineer",
  "Designer",
  "Data Analyst",
  "Product Manager",
] as const;

export const SKILL_SUGGESTIONS = [
  "React",
  "TypeScript",
  "Python",
  "SQL",
  "System design",
  "Communication",
] as const;

export const ANALYSIS_STAGES = [
  { key: "resume_extraction", label: "Extracting resume details", group: "extract" },
  { key: "profile_normalization", label: "Understanding your background", group: "skills" },
  { key: "skill_analysis", label: "Analyzing skills and experience", group: "skills" },
  { key: "goal_analysis", label: "Mapping career goals", group: "goals" },
  { key: "gap_analysis", label: "Comparing role expectations", group: "expectations" },
  { key: "alternatives", label: "Exploring career paths", group: "insights" },
  { key: "roadmap", label: "Building your roadmap", group: "insights" },
  { key: "report", label: "Generating insights", group: "insights" },
] as const;

export const ANALYSIS_GROUPS = [
  { key: "extract", label: "Extracting resume details" },
  { key: "skills", label: "Analyzing skills and experience" },
  { key: "goals", label: "Mapping career goals" },
  { key: "expectations", label: "Comparing role expectations" },
  { key: "insights", label: "Generating insights" },
] as const;

export const MAX_RESUME_BYTES = 10 * 1024 * 1024;

export const QUICK_PROMPTS = [
  "What should I focus on next?",
  "Explain my biggest skill gap",
  "Suggest a project",
  "Should I consider another career path?",
  "Help me create a study plan",
  "Review this job description against my profile:",
] as const;
