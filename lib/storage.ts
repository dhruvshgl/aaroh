import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const localRoot = path.join(process.cwd(), "storage");

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
