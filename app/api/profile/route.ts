import { NextResponse } from "next/server";
import { jsonError, requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { additionalSchema, backgroundSchema, goalsSchema, splitList } from "@/lib/validation";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.userId) return auth.error;
  const userId = auth.userId;
  const profile = await prisma.careerProfile.findUnique({
    where: { userId },
    include: { education: true, skills: true },
  });
  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const auth = await requireApiUser();
  if (!auth.userId) return auth.error;
  const userId = auth.userId;
  const body = await request.json().catch(() => null);
  const background = backgroundSchema.partial().safeParse(body);
  const goals = goalsSchema.partial().safeParse(body);
  const extra = additionalSchema.partial().safeParse(body);
  if (!background.success && !goals.success && !extra.success) {
    return jsonError("No valid profile fields were provided.");
  }
  const profile = await prisma.careerProfile.findUnique({ where: { userId } });
  if (!profile) return jsonError("Profile not found.", 404);

  const data = {
    ...(background.success ? background.data : {}),
    ...(goals.success ? goals.data : {}),
  };
  await prisma.careerProfile.update({
    where: { id: profile.id },
    data: {
      currentRole: data.currentRole,
      yearsOfExperience: data.yearsOfExperience,
      industry: data.industry,
      region: data.region,
      goalText: "goalText" in data ? data.goalText : undefined,
      timeframe: data.timeframe,
      targetEnvironment: data.targetEnvironment,
      enjoys: extra.success ? extra.data.enjoys : undefined,
      dislikes: extra.success ? extra.data.dislikes : undefined,
      currentLearning: extra.success ? extra.data.currentLearning : undefined,
      careerConcern: extra.success ? extra.data.careerConcern : undefined,
      anythingElse: extra.success ? extra.data.anythingElse : undefined,
      interests: extra.success && extra.data.interests ? splitList(extra.data.interests) : undefined,
    },
  });
  if (extra.success && extra.data.skills) {
    const skills = splitList(extra.data.skills);
    await prisma.skill.deleteMany({ where: { profileId: profile.id } });
    await prisma.skill.createMany({
      data: skills.map((name) => ({ profileId: profile.id, name, category: "self_reported" })),
    });
  }
  const updated = await prisma.careerProfile.findUnique({
    where: { id: profile.id },
    include: { education: true, skills: true },
  });
  return NextResponse.json({ profile: updated });
}
