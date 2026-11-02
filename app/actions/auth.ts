"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { unstable_rethrow } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { testLoginMode } from "@/lib/test-mode";
import { loginSchema, signupSchema } from "@/lib/validation";

export type AuthState = { error?: string } | null;

export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
  // In test login mode an existing email simply signs in.
  if (existing && !testLoginMode) return { error: "An account with that email already exists. Log in instead." };

  if (!existing) {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
        profile: { create: {} },
      },
    });
  }

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: existing?.profile?.onboardingComplete ? "/dashboard" : "/onboarding",
    });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AuthError) return { error: "Account created, but sign-in failed. Try logging in." };
    throw error;
  }
  return null;
}

export async function logIn(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const email = parsed.data.email.toLowerCase();
  const profile = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });
  const destination = profile?.profile?.onboardingComplete ? "/dashboard" : "/onboarding";

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: destination,
    });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AuthError) {
      return { error: testLoginMode ? "Enter an email and a password." : "That email and password did not match." };
    }
    throw error;
  }
  return null;
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function oauthSignIn(formData: FormData) {
  const provider = String(formData.get("provider") ?? "");
  if (!["google", "linkedin", "apple"].includes(provider)) return;
  await signIn(provider, { redirectTo: "/onboarding" });
}
