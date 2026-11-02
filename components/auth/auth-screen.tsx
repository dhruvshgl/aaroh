"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, FlaskConical, Loader2 } from "lucide-react";
import { logIn, oauthSignIn, signUp, type AuthState } from "@/app/actions/auth";
import { Logo } from "@/components/brand/logo";
import { MountainScene } from "@/components/brand/mountain";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

type Errors = Partial<Record<"name" | "email" | "password", string>>;

function validate(mode: "signup" | "login", data: FormData, testMode: boolean): Errors {
  const errors: Errors = {};
  const name = String(data.get("name") ?? "").trim();
  const email = String(data.get("email") ?? "").trim();
  const password = String(data.get("password") ?? "");
  if (mode === "signup" && name.length < 2) errors.name = "Enter your full name.";
  if (!email) errors.email = "Enter your email.";
  else if ((mode === "signup" || !testMode) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email, like you@example.com.";
  }
  if (!password) errors.password = "Enter your password.";
  else if (mode === "signup" && !testMode && password.length < 8) errors.password = "Use at least 8 characters.";
  return errors;
}

export function AuthScreen({
  mode,
  providers,
  testMode = false,
}: {
  mode: "signup" | "login";
  providers: { id: string; label: string }[];
  /** Server-provided TEST_LOGIN_MODE flag. */
  testMode?: boolean;
}) {
  const action = mode === "signup" ? signUp : logIn;
  const [state, formAction, pending] = useActionState(action, null as AuthState);
  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState(false);

  function clear(field: keyof Errors) {
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="relative hidden lg:block">
        <MountainScene className="h-full rounded-none" />
        <div className="absolute top-8 left-8">
          <Logo light />
        </div>
      </aside>

      <div className="relative h-28 overflow-hidden lg:hidden">
        <MountainScene caption={null} className="min-h-0 rounded-none" />
        <div className="absolute top-4 left-4">
          <Logo light />
        </div>
      </div>

      <main className="flex items-start justify-center px-4 py-8 sm:items-center sm:py-10">
        <div className="w-full max-w-md animate-fade-up">
          <h1 className="text-h1">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
          <p className="mt-2 text-muted-foreground">
            {mode === "signup"
              ? "Free while in early access. Next, you'll tell Aaroh about your background and goal."
              : "Pick up your career profile, roadmap, and consultant."}
          </p>

          {testMode ? (
            <p role="note" className="mt-5 flex items-start gap-2 rounded-xl border border-warning/40 bg-warning-soft px-3 py-2.5 text-small text-warning-foreground">
              <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                Test mode: any email and password will log you in. Test account:{" "}
                <span className="font-mono font-medium">test@gmail.com</span> / <span className="font-mono font-medium">test123</span>
              </span>
            </p>
          ) : null}

          {providers.length ? (
            <div className="mt-6 space-y-2">
              {providers.map((provider) => (
                <form key={provider.id} action={oauthSignIn}>
                  <input type="hidden" name="provider" value={provider.id} />
                  <Button type="submit" variant="outline" size="pill" className="w-full bg-card">
                    {provider.label}
                  </Button>
                </form>
              ))}
              <div className="flex items-center gap-3 py-2 text-caption tracking-widest text-muted-foreground uppercase">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>
            </div>
          ) : null}

          <form
            action={formAction}
            noValidate
            onSubmit={(event) => {
              const next = validate(mode, new FormData(event.currentTarget), testMode);
              setErrors(next);
              if (Object.keys(next).length) {
                event.preventDefault();
                const first = Object.keys(next)[0];
                event.currentTarget.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
              }
            }}
            className="mt-6 space-y-4"
          >
            {mode === "signup" ? (
              <Field id="name" label="Full name" error={errors.name}>
                <input
                  id="name"
                  name="name"
                  autoComplete="name"
                  autoFocus
                  className="field"
                  placeholder="Your name"
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  onChange={() => clear("name")}
                />
              </Field>
            ) : null}
            <Field id="email" label="Email" error={errors.email}>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus={mode === "login"}
                className="field"
                placeholder="you@example.com"
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? "email-error" : undefined}
                onChange={() => clear("email")}
              />
            </Field>
            <Field
              id="password"
              label="Password"
              error={errors.password}
              hint={mode === "signup" && !testMode ? "At least 8 characters." : undefined}
            >
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className="field pr-12"
                  placeholder="••••••••"
                  aria-invalid={errors.password ? true : undefined}
                  aria-describedby={errors.password ? "password-error" : mode === "signup" && !testMode ? "password-hint" : undefined}
                  onChange={() => clear("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-[0.9rem] text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                </button>
              </div>
            </Field>

            {state?.error ? (
              <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger-soft px-3 py-2.5 text-small text-danger-foreground">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {state.error}
              </p>
            ) : null}

            <Button type="submit" disabled={pending} size="pill" className="h-12 w-full text-base">
              {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {pending ? (mode === "signup" ? "Creating your account…" : "Logging in…") : mode === "signup" ? "Create account" : "Log in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-small text-muted-foreground">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                  Log in
                </Link>
              </>
            ) : (
              <>
                New to Aaroh?{" "}
                <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
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
