"use client";

import { useActionState } from "react";
import Link from "next/link";
import { logIn, oauthSignIn, signUp, type AuthState } from "@/app/actions/auth";
import { Logo } from "@/components/brand/logo";
import { MountainScene } from "@/components/brand/mountain";
import { Button } from "@/components/ui/button";

const steps = ["Account", "Background", "Goals", "Resume", "Details"];

export function AuthScreen({
  mode,
  providers,
}: {
  mode: "signup" | "login";
  providers: { id: string; label: string }[];
}) {
  const action = mode === "signup" ? signUp : logIn;
  const [state, formAction, pending] = useActionState(action, null as AuthState);

  return (
    <div className="grid min-h-dvh lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="relative hidden lg:block">
        <MountainScene />
        <div className="absolute top-8 left-8">
          <Logo light />
        </div>
      </aside>
      <main className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <Logo />
          </div>
          {mode === "signup" ? (
            <ol className="mb-6 flex gap-2 overflow-x-auto text-xs text-muted-foreground">
              {steps.map((step, index) => (
                <li key={step} className={index === 0 ? "font-medium text-primary" : ""}>
                  {index + 1}. {step}
                </li>
              ))}
            </ol>
          ) : null}
          <h1 className="text-4xl">{mode === "signup" ? "Welcome to Aaroh" : "Welcome back"}</h1>
          <p className="mt-2 text-muted-foreground">
            {mode === "signup"
              ? "Create your account and tell Aaroh where you are headed."
              : "Pick up your career profile, roadmap, and consultant."}
          </p>

          {providers.length ? (
            <div className="mt-6 space-y-2">
              {providers.map((provider) => (
                <form key={provider.id} action={oauthSignIn}>
                  <input type="hidden" name="provider" value={provider.id} />
                  <Button type="submit" variant="outline" className="h-11 w-full rounded-full bg-card">
                    {provider.label}
                  </Button>
                </form>
              ))}
              <p className="py-1 text-center text-xs tracking-widest text-muted-foreground uppercase">or</p>
            </div>
          ) : null}

          <form action={formAction} className="mt-4 space-y-3">
            {mode === "signup" ? (
              <label className="block text-sm">
                Full name
                <input name="name" required autoComplete="name" className="field mt-1" placeholder="Your name" />
              </label>
            ) : null}
            <label className="block text-sm">
              Email
              <input name="email" type="email" required autoComplete="email" className="field mt-1" placeholder="you@example.com" />
            </label>
            <label className="block text-sm">
              Password
              <input
                name="password"
                type="password"
                required
                minLength={mode === "signup" ? 8 : 1}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className="field mt-1"
                placeholder="••••••••"
              />
            </label>
            {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
            <Button type="submit" disabled={pending} className="h-12 w-full rounded-full text-base">
              {pending ? "Please wait…" : mode === "signup" ? "Create Account" : "Log in"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <Link href="/login" className="text-primary">
                  Log in
                </Link>
              </>
            ) : (
              <>
                New to Aaroh?{" "}
                <Link href="/signup" className="text-primary">
                  Create an account
                </Link>
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
