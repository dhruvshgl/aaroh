import { extractText } from "unpdf";
import mammoth from "mammoth";

export function sniffDocument(bytes: Buffer): "pdf" | "docx" | "unknown" {
  if (bytes.length >= 4 && bytes.subarray(0, 4).toString("utf8") === "%PDF") {
    return "pdf";
  }
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b) {
    return "docx";
  }
  return "unknown";
}

export async function extractResumeText(bytes: Buffer, kind: "pdf" | "docx") {
  if (kind === "pdf") {
    const result = await extractText(new Uint8Array(bytes), { mergePages: true });
    return result.text.trim();
  }
  const result = await mammoth.extractRawText({ buffer: bytes });
  return result.value.trim();
}
