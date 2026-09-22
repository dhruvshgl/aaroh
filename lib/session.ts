import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function getSessionUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function requireUser() {
  const id = await getSessionUserId();
  if (!id) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: { include: { education: true, skills: true } },
    },
  });
  if (!user) {
    await signOut({ redirectTo: "/login" });
    redirect("/login");
  }
  return user;
}
