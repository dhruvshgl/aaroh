import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import { AppShell } from "@/components/shell/app-shell";
import { requireUser } from "@/lib/session";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!user.profile?.onboardingComplete) redirect("/onboarding");
  return <AppShell name={user.name || "there"}>{children}</AppShell>;
}
