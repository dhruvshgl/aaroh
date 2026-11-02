import { z } from "zod";
import {
  CONCERNS,
  ENVIRONMENTS,
  EXPERIENCE_BANDS,
  TIMEFRAMES,
} from "@/lib/constants";
import { testLoginMode } from "@/lib/test-mode";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(80),
  email: z.string().trim().email("Enter a valid email.").max(160),
  // Test login mode accepts short passwords such as "test123".
  password: testLoginMode
    ? z.string().min(1, "Enter a password.").max(128)
    : z.string().min(8, "Use at least 8 characters.").max(128),
});

export const loginSchema = z.object({
  // Test login mode accepts any non-empty email.
  email: testLoginMode
    ? z.string().trim().min(1, "Enter your email.").max(160)
    : z.string().trim().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

export const backgroundSchema = z.object({
  currentRole: z.string().trim().min(2, "Add your current role.").max(80),
  yearsOfExperience: z.enum(EXPERIENCE_BANDS, {
    error: "Choose your experience.",
  }),
  degree: optionalText(120),
  field: optionalText(120),
  institution: optionalText(160),
  graduationYear: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .refine(
      (value) =>
        !value ||
        (/^\d{4}$/.test(value) && Number(value) >= 1950 && Number(value) <= 2035),
      "Enter a graduation year between 1950 and 2035.",
    ),
  industry: optionalText(80),
  region: optionalText(80),
});

export const goalsSchema = z.object({
  goalText: z
    .string()
    .trim()
    .min(3, "Tell Aaroh what you want, even if you are unsure.")
    .max(500),
  timeframe: z.enum(TIMEFRAMES, { error: "Choose a timeframe." }),
  targetEnvironment: z.enum(ENVIRONMENTS, {
    error: "Choose a target environment.",
  }),
});

export const additionalSchema = z.object({
  skills: z.string().trim().min(2, "Add at least one skill.").max(500),
  interests: optionalText(500),
  enjoys: optionalText(1000),
  dislikes: optionalText(1000),
  currentLearning: optionalText(500),
  careerConcern: z.enum(CONCERNS, { error: "Choose a career concern." }),
  anythingElse: optionalText(1500),
});

export const adjustPlanSchema = z.object({
  hoursPerWeek: z.coerce.number().int().min(1).max(60),
  notes: z.string().trim().max(1000).optional().transform((value) => value || undefined),
});

export const projectStatusSchema = z.object({
  projectId: z.string().min(1),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]),
});

export const settingsSchema = backgroundSchema.merge(goalsSchema).extend({
  enjoys: optionalText(1000),
  dislikes: optionalText(1000),
  currentLearning: optionalText(500),
  careerConcern: z.enum(CONCERNS).optional(),
  anythingElse: optionalText(1500),
  skills: z.string().trim().min(2).max(500),
  interests: optionalText(500),
});

export function splitList(value: string | undefined) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 24);
}
