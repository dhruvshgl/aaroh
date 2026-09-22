import { removeProject, updateProject } from "@/app/api/projects/route";
import { requireApiUser } from "@/lib/api";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if (!auth.userId) return auth.error;
  const userId = auth.userId;
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  return updateProject(userId, id, body);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if (!auth.userId) return auth.error;
  const userId = auth.userId;
  const { id } = await context.params;
  return removeProject(userId, id);
}
