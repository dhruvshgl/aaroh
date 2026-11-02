import Link from "next/link";
import { Compass } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 py-12">
      <div className="flex max-w-md animate-fade-up flex-col items-center text-center">
        <Logo compact />
        <span className="mt-10 grid size-16 place-items-center rounded-full bg-secondary">
          <Compass className="size-7 text-primary" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-h1">That page is not on this path.</h1>
        <p className="mt-3 text-muted-foreground">The link may be old, or the page may have moved. Let&apos;s get you back on track.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/dashboard" className={cn(buttonVariants({ size: "pill" }))}>
            Go to your dashboard
          </Link>
          <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "pill" }), "bg-card")}>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
