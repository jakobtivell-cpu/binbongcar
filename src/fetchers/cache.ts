import type { Logger } from "../utils/logger";

export interface CacheOptions {
  force: boolean;
  rootDir?: string;
}

/** Disk cache (full layout implemented in Prompt 4). */
export function isCached(_url: string, _maxAgeHours?: number): boolean {
  return false;
}

export function getFromCache(_url: string): Buffer | string | null {
  return null;
}

export function saveToCache(
  _url: string,
  _content: Buffer | string,
  _ext: string,
  _logger?: Logger,
): string {
  return "";
}
