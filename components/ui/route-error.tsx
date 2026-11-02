"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CloudOff, RotateCcw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RouteError({
  error,
  retry,
  title = "Something went wrong on this page",
  homeHref = "/dashboard",
  homeLabel = "Back to dashboard",
}: {
  error: Error & { digest?: string };
  retry: () => void;
  title?: string;
  homeHref?: string;
  homeLabel?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg animate-fade-up flex-col items-center px-4 py-16 text-center" role="alert">
      <span className="grid size-16 place-items-center rounded-full bg-secondary">
        <CloudOff className="size-7 text-primary" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-h1">{title}</h1>
      <p className="mt-3 text-muted-foreground">
        Your data is safe. This is usually temporary — try again, and if it keeps happening, come back in a few minutes.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button size="pill" onClick={() => retry()}>
          <RotateCcw aria-hidden="true" />
          Try again
        </Button>
        <Link href={homeHref} className={cn(buttonVariants({ variant: "outline", size: "pill" }), "bg-card")}>
          {homeLabel}
        </Link>
      </div>
      {error.digest ? <p className="mt-6 font-mono text-caption text-muted-foreground">Reference: {error.digest}</p> : null}
    </div>
  );
}
