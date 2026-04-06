import type { FetchResult } from "../models/types";
import { createHttpClient, requestWithBackoff } from "../utils/http-client";

export interface StaticFetchOptions {
  slow?: boolean;
}

/**
 * Cheerio-first path: plain HTTP GET (Prompt 4 will add encoding detection and cache).
 */
export async function fetchStaticHtml(
  url: string,
  options: StaticFetchOptions = {},
): Promise<FetchResult> {
  const timestamp = new Date().toISOString();
  try {
    const client = createHttpClient({ slow: options.slow, timeoutMs: 10_000 });
    const res = await requestWithBackoff<string>(
      client,
      { method: "GET", url, responseType: "text" },
      { slow: options.slow, maxRetries: 3 },
    );
    const contentType = String(res.headers["content-type"] || "text/html");
    const body = typeof res.data === "string" ? res.data : String(res.data ?? "");
    if (res.status >= 400) {
      return {
        url,
        content: body.length > 0 ? body : null,
        contentType,
        fetchMethod: "static",
        timestamp,
        error: `HTTP ${res.status}`,
      };
    }
    return {
      url,
      content: body,
      contentType,
      fetchMethod: "static",
      timestamp,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      url,
      content: null,
      contentType: "text/html",
      fetchMethod: "static",
      timestamp,
      error: msg,
    };
  }
}
