import { argv } from "node:process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function getUserName() {
  const userArg = "--username=";
  const arg = argv.splice(2).find((item) => item.includes(userArg));
  const userName = arg ? arg.split("=")[1] : "guest";
  return userName;
}

export function getDirName(moduleUrl) {
  const __filename = fileURLToPath(moduleUrl);
  return path.dirname(__filename);
}

export async function isDirectory(url) {
  try {
    const stat = await fs.stat(url);
    return await stat.isDirectory();
  } catch (e) {
    return false
  }
}

export async function isFile(url) {
  try {
    const stat = await fs.stat(url);
    return await stat.isFile();
  } catch {
    return false;
  }
}
