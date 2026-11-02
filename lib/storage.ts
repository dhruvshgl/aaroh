import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/**
 * Where uploaded resume files are kept. The app only needs the extracted text
 * (stored in Postgres), so the file itself is an archive copy.
 * Vercel's project folder is read-only, so there it defaults to the writable
 * (ephemeral) temp directory. Override with STORAGE_DIR.
 */
const localRoot = path.resolve(
  process.env.STORAGE_DIR ||
    (process.env.VERCEL ? path.join(os.tmpdir(), "aaroh-storage") : path.join(process.cwd(), "storage")),
);

function localPath(key: string) {
  const destination = path.resolve(localRoot, key);
  if (!destination.startsWith(`${localRoot}${path.sep}`)) {
    throw new Error("Invalid storage path.");
  }
  return destination;
}

export async function saveObject(key: string, body: Buffer, _mimeType: string) {
  const destination = localPath(key);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, body);
}

export async function readObject(key: string) {
  return readFile(localPath(key));
}

export async function deleteObject(key: string) {
  await rm(localPath(key), { force: true });
}
