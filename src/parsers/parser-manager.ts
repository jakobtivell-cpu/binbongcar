import type { CarVariant, FetchResult, PageEntry } from "../models/types";
import {
  derivePorscheModelRangeIdFromUrl,
  parsePorscheModelOverviewHtml,
} from "./oem/porsche-se";

export interface ParseContext {
  retrievalDate: string;
}

export function parseFetchedPage(
  oemId: string,
  page: PageEntry,
  result: FetchResult,
  ctx: ParseContext,
): Partial<CarVariant>[] {
  if (result.error || result.content === null) return [];
  const html =
    typeof result.content === "string"
      ? result.content
      : Buffer.isBuffer(result.content)
        ? result.content.toString("utf8")
        : String(result.content);
  if (!html.trim()) return [];

  if (
    oemId === "porsche-se" &&
    page.role === "overview" &&
    page.strategy === "static"
  ) {
    const modelRangeId = derivePorscheModelRangeIdFromUrl(page.url);
    if (!modelRangeId) return [];
    return parsePorscheModelOverviewHtml(html, {
      sourceUrl: page.url,
      retrievalDate: ctx.retrievalDate,
      modelRangeId,
    });
  }

  return [];
}
