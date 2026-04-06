import type { FetchResult } from "../models/types";

export async function fetchApi(_url: string): Promise<FetchResult> {
  return {
    url: _url,
    content: null,
    contentType: "application/json",
    fetchMethod: "api",
    timestamp: new Date().toISOString(),
    error: "Not implemented (Prompt 4)",
  };
}
