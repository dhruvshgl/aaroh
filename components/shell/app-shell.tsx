"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import {
  Compass,
  FolderKanban,
  Home,
  Map,
  MessageCircle,
  Settings,
  SquareChartGantt,
} from "lucide-react";

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/report", label: "Report", icon: SquareChartGantt },
  { href: "/dashboard/roadmap", label: "Roadmap", icon: Map },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/alternatives", label: "Paths", icon: Compass },
  { href: "/dashboard/chat", label: "Chat", icon: MessageCircle },
];

function active(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const thread = pathname.startsWith("/dashboard/chat/");
  const initial = name.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="min-h-dvh bg-background">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-border bg-sidebar px-3 py-5 lg:flex">
        <Logo compact href="/dashboard" className="px-2" />
        <nav className="mt-8 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const current = active(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm",
                  current ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link href="/settings" className="mt-auto flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary">
          <Settings className="size-4" />
          Settings
        </Link>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/80 bg-background/90 px-4 py-3 backdrop-blur lg:px-8">
          <div className="lg:hidden">
            <Logo compact href="/dashboard" />
          </div>
          <p className="hidden text-sm text-muted-foreground lg:block">A personal view of where you are, and what is next.</p>
          <details className="relative">
            <summary className="grid size-9 cursor-pointer list-none place-items-center rounded-full bg-primary text-sm text-primary-foreground">
              {initial}
            </summary>
            <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-border bg-popover p-2 text-sm shadow-lg">
              <p className="px-2 py-1.5 font-medium">{name}</p>
              <Link href="/settings" className="block rounded-xl px-2 py-1.5 hover:bg-secondary">
                Settings
              </Link>
              <form action={signOutAction}>
                <button type="submit" className="w-full rounded-xl px-2 py-1.5 text-left hover:bg-secondary">
                  Log out
                </button>
              </form>
            </div>
          </details>
        </header>
        <main className={thread ? "px-0 pb-0 lg:px-8 lg:py-6" : "px-4 py-6 pb-24 lg:px-8 lg:pb-10"}>{children}</main>
      </div>

      {thread ? null : (
        <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-border bg-card/95 px-1 py-2 backdrop-blur lg:hidden">
          {items.filter((item) => item.href !== "/dashboard/alternatives").map((item) => {
            const Icon = item.icon;
            const current = active(pathname, item.href);
            return (
              <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-1 text-[11px]", current ? "text-primary" : "text-muted-foreground")}>
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
