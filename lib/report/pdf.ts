import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ALIGNMENT_DISCLAIMER } from "@/lib/career/alignment";

type ReportPdfInput = {
  name: string;
  score: number;
  explanation: string;
  snapshot: {
    currentRole?: string;
    experience?: string;
    location?: string;
    primaryProfile?: string;
    careerGoal?: string;
  };
  strengths: { title: string; evidence: string }[];
  gaps: { skill: string; whyItMatters: string; recommendedAction: string }[];
  paths: { roleName: string; fitLabel: string; whyIdentified: string }[];
};

function sanitize(value: string) {
  return value.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ").replace(/\s+\n/g, "\n");
}

function wrap(text: string, width: number) {
  const words = sanitize(text).split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width) {
      if (current) lines.push(current);
      current = word.slice(0, width);
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function renderReportPdf(input: ReportPdfInput) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([612, 792]);
  let y = 740;

  const ensure = (needed: number) => {
    if (y - needed < 56) {
      page = doc.addPage([612, 792]);
      y = 740;
    }
  };

  const write = (text: string, options?: { size?: number; bold?: boolean; color?: [number, number, number] }) => {
    const size = options?.size ?? 11;
    const face = options?.bold ? bold : font;
    const color = options?.color ?? [0.14, 0.12, 0.1];
    for (const line of wrap(text, options?.bold ? 70 : 88)) {
      ensure(size + 6);
      page.drawText(line, { x: 54, y, size, font: face, color: rgb(color[0], color[1], color[2]) });
      y -= size + 5;
    }
  };

  page.drawRectangle({ x: 0, y: 760, width: 612, height: 32, color: rgb(0.16, 0.28, 0.22) });
  page.drawText("Aaroh  ·  Career Report", {
    x: 54,
    y: 772,
    size: 12,
    font: bold,
    color: rgb(0.97, 0.95, 0.9),
  });

  write(input.name || "Your career report", { size: 20, bold: true });
  y -= 6;
  write(`Career alignment  ${input.score}%`, { size: 14, bold: true, color: [0.16, 0.28, 0.22] });
  write(ALIGNMENT_DISCLAIMER, { size: 9, color: [0.35, 0.32, 0.28] });
  y -= 8;
  write(input.explanation);
  y -= 10;
  write("Career snapshot", { size: 14, bold: true });
  write(`${input.snapshot.currentRole ?? "Role not set"} · ${input.snapshot.experience ?? "Experience not set"}`);
  if (input.snapshot.location) write(input.snapshot.location);
  if (input.snapshot.primaryProfile) write(input.snapshot.primaryProfile);
  write(`Goal: ${input.snapshot.careerGoal ?? "Not set"}`);
  y -= 8;
  write("Strengths", { size: 14, bold: true });
  for (const strength of input.strengths) {
    write(strength.title, { bold: true });
    write(strength.evidence);
    y -= 4;
  }
  write("Gaps", { size: 14, bold: true });
  for (const gap of input.gaps) {
    write(gap.skill, { bold: true });
    write(`${gap.whyItMatters} Next: ${gap.recommendedAction}`);
    y -= 4;
  }
  write("Paths to consider", { size: 14, bold: true });
  for (const path of input.paths) {
    write(`${path.roleName} — ${path.fitLabel}`, { bold: true });
    write(path.whyIdentified);
    y -= 4;
  }

  return Buffer.from(await doc.save());
}
