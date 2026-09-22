import { SettingsForm } from "@/components/settings/settings-form";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = user.profile;
  const education = profile?.education[0];
  const resumes = await prisma.resume.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, filename: true },
  });
  return (
    <SettingsForm
      resumes={resumes}
      values={{
        currentRole: profile?.currentRole ?? "",
        yearsOfExperience: profile?.yearsOfExperience ?? "2–3 years",
        industry: profile?.industry ?? "",
        region: profile?.region ?? "",
        degree: education?.degree ?? "",
        field: education?.field ?? "",
        institution: education?.institution ?? "",
        graduationYear: education?.graduationYear ? String(education.graduationYear) : "",
        goalText: profile?.goalText ?? "",
        timeframe: profile?.timeframe ?? "6–12 months",
        targetEnvironment: profile?.targetEnvironment ?? "Not sure",
        skills: profile?.skills.map((skill) => skill.name).join(", ") ?? "",
        interests: profile?.interests.join(", ") ?? "",
        enjoys: profile?.enjoys ?? "",
        dislikes: profile?.dislikes ?? "",
        currentLearning: profile?.currentLearning ?? "",
        careerConcern: profile?.careerConcern ?? "",
        anythingElse: profile?.anythingElse ?? "",
      }}
    />
  );
}
