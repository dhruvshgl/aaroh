import { reportPdf } from "@/app/api/report/route";
import { requireApiUser } from "@/lib/api";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.userId) return auth.error;
  const userId = auth.userId;
  return reportPdf(userId);
}
