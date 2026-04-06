import type { FetchResult, FetchStrategy, PageEntry } from "../models/types";
import { fetchApi } from "./api-fetcher";
import { fetchJsRendered } from "./js-rendered";
import { fetchPdf } from "./pdf-fetcher";
import { fetchStaticHtml } from "./static-html";

export interface FetchContext {
  oemId: string;
  modelName: string;
  force?: boolean;
  slow?: boolean;
}

/** Strategy router (fallback ladder in Prompt 4). */
export async function fetchPage(
  page: PageEntry,
  _ctx: FetchContext,
  _defaultStrategy?: FetchStrategy,
): Promise<FetchResult> {
  const strategy = page.strategy;
  switch (strategy) {
    case "static":
      return fetchStaticHtml(page.url, { slow: _ctx.slow });
    case "js":
      return fetchJsRendered(page.url);
    case "pdf":
      return fetchPdf(page.url);
    case "api":
      return fetchApi(page.url);
    default:
      return {
        url: page.url,
        content: null,
        contentType: "text/plain",
        fetchMethod: "static",
        timestamp: new Date().toISOString(),
        error: `Unknown strategy: ${String(strategy)}`,
      };
  }
}
