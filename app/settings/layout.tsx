import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { roadmapProgress } from "@/lib/progress";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!user.profile?.onboardingComplete) redirect("/onboarding");
  const progress = await roadmapProgress(user.id);
  return (
    <AppShell name={user.name || "there"} email={user.email ?? ""} progress={progress}>
      {children}
    </AppShell>
  );
}
