import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import { OnboardingWizard } from "@/components/onboarding/wizard";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.profile?.onboardingComplete) redirect("/dashboard");
  const profile = user.profile;
  const education = profile?.education[0];
  const resume = await prisma.resume.findFirst({
    where: { userId: user.id, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <OnboardingWizard
      resume={resume ? { id: resume.id, filename: resume.filename, sizeBytes: resume.sizeBytes } : null}
      profile={{
        currentRole: profile?.currentRole ?? null,
        yearsOfExperience: profile?.yearsOfExperience ?? null,
        industry: profile?.industry ?? null,
        region: profile?.region ?? null,
        goalText: profile?.goalText ?? null,
        timeframe: profile?.timeframe ?? null,
        targetEnvironment: profile?.targetEnvironment ?? null,
        enjoys: profile?.enjoys ?? null,
        dislikes: profile?.dislikes ?? null,
        currentLearning: profile?.currentLearning ?? null,
        careerConcern: profile?.careerConcern ?? null,
        anythingElse: profile?.anythingElse ?? null,
        interests: profile?.interests ?? [],
        skills: profile?.skills.map((skill) => skill.name) ?? [],
        degree: education?.degree && education.degree !== "Not specified" ? education.degree : "",
        field: education?.field ?? "",
        institution: education?.institution ?? "",
        graduationYear: education?.graduationYear ? String(education.graduationYear) : "",
        onboardingStep: profile?.onboardingStep ?? "background",
      }}
    />
  );
}
