import type { FetchResult } from "../models/types";

export async function fetchJsRendered(_url: string): Promise<FetchResult> {
  return {
    url: _url,
    content: null,
    contentType: "text/html",
    fetchMethod: "js",
    timestamp: new Date().toISOString(),
    error: "Not implemented (Prompt 4 — optional Playwright)",
  };
}
