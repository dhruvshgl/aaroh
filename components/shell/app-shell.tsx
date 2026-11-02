"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Compass,
  FolderKanban,
  Home,
  LogOut,
  Map,
  MessageCircle,
  MoreHorizontal,
  Settings,
  SquareChartGantt,
  type LucideIcon,
} from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { Logo } from "@/components/brand/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };

const items: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/report", label: "Report", icon: SquareChartGantt },
  { href: "/dashboard/roadmap", label: "Roadmap", icon: Map },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/alternatives", label: "Paths", icon: Compass },
  { href: "/dashboard/chat", label: "Chat", icon: MessageCircle },
];

const settingsItem: NavItem = { href: "/settings", label: "Settings", icon: Settings };

/** Primary tabs on mobile; the rest live under "More". */
const mobilePrimary = ["/dashboard", "/dashboard/report", "/dashboard/roadmap", "/dashboard/chat"];
const mobileMore = [...items.filter((item) => !mobilePrimary.includes(item.href)), settingsItem];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const detailLabels: Record<string, string> = {
  "/dashboard/projects": "Project",
  "/dashboard/alternatives": "Path",
  "/dashboard/chat": "Conversation",
};

function breadcrumb(pathname: string) {
  const all = [...items, settingsItem];
  const section = [...all].reverse().find((item) => isActive(pathname, item.href));
  if (!section) return [{ label: "Aaroh", href: "/dashboard" }];
  const crumbs = [{ label: section.label, href: section.href }];
  if (pathname !== section.href && detailLabels[section.href]) {
    crumbs.push({ label: detailLabels[section.href], href: pathname });
  }
  return crumbs;
}

export function AppShell({
  name,
  email,
  progress,
  children,
}: {
  name: string;
  email?: string;
  progress?: { done: number; total: number } | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const thread = pathname.startsWith("/dashboard/chat/");
  const initial = name.trim().charAt(0).toUpperCase() || "A";
  const crumbs = breadcrumb(pathname);
  const signOutForm = useRef<HTMLFormElement>(null);
  const moreActive = mobileMore.some((item) => isActive(pathname, item.href));

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <form ref={signOutForm} action={signOutAction} className="hidden" />

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 lg:flex">
        <Logo compact href="/dashboard" className="px-2" />
        <nav aria-label="Main" className="mt-8 space-y-1">
          {items.map((item) => (
            <SidebarLink key={item.href} item={item} current={isActive(pathname, item.href)} />
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          {progress ? (
            <Link
              href="/dashboard/roadmap"
              className="block rounded-xl border border-sidebar-border bg-card px-3 py-3 hover:border-primary/30"
            >
              <p className="text-caption font-medium text-foreground">Your roadmap</p>
              <p className="mt-0.5 text-caption text-muted-foreground">
                {progress.done} of {progress.total} phases done
              </p>
              <ProgressBar value={progress.done} max={progress.total} label="Roadmap progress" className="mt-2 h-1.5" />
            </Link>
          ) : null}
          <SidebarLink item={settingsItem} current={isActive(pathname, settingsItem.href)} />
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-3 border-b border-border/80 bg-background/90 px-4 backdrop-blur lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="lg:hidden">
              <Logo compact href="/dashboard" />
            </div>
            <nav aria-label="Breadcrumb" className="hidden min-w-0 lg:block">
              <ol className="flex items-center gap-1.5 text-small">
                {crumbs.map((crumb, index) => {
                  const last = index === crumbs.length - 1;
                  return (
                    <li key={crumb.href} className="flex min-w-0 items-center gap-1.5">
                      {index > 0 ? <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden="true" /> : null}
                      {last ? (
                        <span aria-current="page" className="truncate font-medium text-foreground">
                          {crumb.label}
                        </span>
                      ) : (
                        <Link href={crumb.href} className="truncate text-muted-foreground hover:text-foreground">
                          {crumb.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`Account menu for ${name}`}
              className="grid size-10 place-items-center rounded-full bg-primary text-sm font-medium text-primary-foreground ring-offset-2 ring-offset-background hover:bg-primary/90 data-popup-open:ring-2 data-popup-open:ring-ring/40"
            >
              {initial}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-xl p-1.5">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-2 py-1.5">
                  <span className="block truncate text-small font-medium text-foreground">{name}</span>
                  {email ? <span className="block truncate text-caption font-normal">{email}</span> : null}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="min-h-10 rounded-lg px-2" render={<Link href="/settings" />}>
                <Settings aria-hidden="true" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="min-h-10 rounded-lg px-2" onClick={() => signOutForm.current?.requestSubmit()}>
                <LogOut aria-hidden="true" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main
          id="main"
          tabIndex={-1}
          className={cn("outline-none", thread ? "px-0 pb-0 lg:px-8 lg:py-6" : "px-4 py-6 pb-28 sm:py-8 lg:px-8 lg:pb-12")}
        >
          {children}
        </main>
      </div>

      {thread ? null : (
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-border bg-card/95 px-1 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden"
        >
          {items
            .filter((item) => mobilePrimary.includes(item.href))
            .map((item) => (
              <MobileTab key={item.href} item={item} current={isActive(pathname, item.href)} />
            ))}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px]",
                moreActive ? "font-medium text-primary" : "text-muted-foreground",
              )}
            >
              {moreActive ? <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" aria-hidden="true" /> : null}
              <MoreHorizontal className="size-5" aria-hidden="true" />
              More
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" sideOffset={8} className="w-52 rounded-xl p-1.5">
              {mobileMore.map((item) => {
                const Icon = item.icon;
                const current = isActive(pathname, item.href);
                return (
                  <DropdownMenuItem
                    key={item.href}
                    className={cn("min-h-11 rounded-lg px-2", current && "font-medium text-primary")}
                    render={<Link href={item.href} aria-current={current ? "page" : undefined} />}
                  >
                    <Icon aria-hidden="true" />
                    {item.label}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="min-h-11 rounded-lg px-2" onClick={() => signOutForm.current?.requestSubmit()}>
                <LogOut aria-hidden="true" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      )}
    </div>
  );
}

function SidebarLink({ item, current }: { item: NavItem; current: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={current ? "page" : undefined}
      className={cn(
        "relative flex min-h-10 items-center gap-3 rounded-xl px-3 py-2.5 text-small transition-colors",
        current
          ? "bg-primary/[0.08] font-semibold text-primary"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      {current ? <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-primary" aria-hidden="true" /> : null}
      <Icon className="size-4" aria-hidden="true" />
      {item.label}
    </Link>
  );
}

function MobileTab({ item, current }: { item: NavItem; current: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={current ? "page" : undefined}
      className={cn(
        "relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px]",
        current ? "font-medium text-primary" : "text-muted-foreground",
      )}
    >
      {current ? <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" aria-hidden="true" /> : null}
      <Icon className="size-5" aria-hidden="true" />
      {item.label}
    </Link>
  );
}
