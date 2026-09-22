import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function apiUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

type ApiAuth =
  | { userId: string; error?: never }
  | { userId: null; error: NextResponse };

export async function requireApiUser(): Promise<ApiAuth> {
  const userId = await apiUserId();
  if (!userId) return { userId: null, error: jsonError("Sign in to continue.", 401) };
  return { userId };
}
