import type { FetchResult } from "../models/types";

export async function fetchPdf(_url: string): Promise<FetchResult> {
  return {
    url: _url,
    content: null,
    contentType: "application/pdf",
    fetchMethod: "pdf",
    timestamp: new Date().toISOString(),
    error: "Not implemented (Prompt 4)",
  };
}
