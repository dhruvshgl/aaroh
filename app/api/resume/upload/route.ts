import { NextResponse } from "next/server";
import { jsonError, requireApiUser } from "@/lib/api";
import { MAX_RESUME_BYTES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { extractResumeText, sniffDocument } from "@/lib/resume/extract";
import { saveObject } from "@/lib/storage";

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.userId) return auth.error;
  const userId = auth.userId;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return jsonError("Choose a resume file.");
  const filename = file.name || "resume";
  const lower = filename.toLowerCase();
  if (lower.endsWith(".doc") && !lower.endsWith(".docx")) {
    return jsonError("Save your resume as a PDF or DOCX and upload it again. Older .doc files are not supported.");
  }
  if (file.size <= 0 || file.size > MAX_RESUME_BYTES) {
    return jsonError("Resume files need to be under 10MB.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniffDocument(bytes);
  if (kind === "unknown") {
    return jsonError("Upload a PDF or DOCX resume. The file contents did not match a supported format.");
  }
  if (kind === "pdf" && !lower.endsWith(".pdf")) return jsonError("The file extension does not match a PDF.");
  if (kind === "docx" && !lower.endsWith(".docx")) return jsonError("The file extension does not match a DOCX.");

  let text = "";
  try {
    text = await extractResumeText(bytes, kind);
  } catch {
    return jsonError("Aaroh couldn't read that file. Try exporting it as PDF and upload again.");
  }
  if (text.length < 40) {
    return jsonError("That file didn't include enough readable text. Try a text-based PDF or DOCX.");
  }

  const mimeType =
    kind === "pdf"
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  const resume = await prisma.resume.create({
    data: {
      userId,
      filename,
      mimeType,
      sizeBytes: file.size,
      storageKey: "pending",
      status: "PROCESSING",
    },
  });
  const storageKey = `resumes/${userId}/${resume.id}`;
  try {
    await saveObject(storageKey, bytes, mimeType);
    const saved = await prisma.resume.update({
      where: { id: resume.id },
      data: { storageKey, extractedText: text, status: "COMPLETED" },
    });
    return NextResponse.json({
      resumeId: saved.id,
      filename: saved.filename,
      sizeBytes: saved.sizeBytes,
      status: "uploaded",
    });
  } catch {
    await prisma.resume.update({
      where: { id: resume.id },
      data: { status: "FAILED", error: "Storage failed." },
    });
    return jsonError("The resume could not be stored. Try again.", 500);
  }
}
