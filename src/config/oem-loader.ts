import * as fs from "fs";
import * as path from "path";
import type { OEMConfig, OEMRegistryFile } from "../models/types";

export function loadOemRegistry(rootDir: string = process.cwd()): OEMRegistryFile {
  const p = path.join(rootDir, "data", "oem-registry.json");
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw) as OEMRegistryFile;
}

export function loadOemConfig(
  configFile: string,
  rootDir: string = process.cwd(),
): OEMConfig {
  const p = path.join(rootDir, "data", configFile);
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw) as OEMConfig;
}
