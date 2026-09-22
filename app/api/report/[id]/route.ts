import { reportById } from "@/app/api/report/route";
import { requireApiUser } from "@/lib/api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if (!auth.userId) return auth.error;
  const userId = auth.userId;
  const { id } = await context.params;
  return reportById(userId, id);
}
