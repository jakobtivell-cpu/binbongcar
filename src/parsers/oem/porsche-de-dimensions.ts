/**
 * Fallback: Porsche Germany / USA (.com) host non-market-specific technical dimensions
 * (length, wheelbase, width, height) in embedded JSON on some model sub-pages.
 *
 * @see https://www.porsche.com/germany/ and https://www.porsche.com/usa/ — under /models/…
 */

import type { CarVariant } from "../../models/types";
import { germanMmDimensionToMeters } from "../../extraction/normaliser";

/** Host + models base (not the marketing homepage). */
export const PORSCHE_DE_MODELS_BASE = "https://www.porsche.com/germany/models/";

/**
 * Extra DE paths (under models/) that carry `derivateCode` + dimension attributes.
 * Extend per family when Porsche adds comparable JSON pages.
 */
export const PORSCHE_DE_DIMENSION_PATHS: Record<string, string[]> = {
  macan: ["macan/macan-electric-models/"],
};

const DERIVATE_RE =
  /derivateCode&quot;:\[0,&quot;([A-Z0-9]+)&quot;\]/g;

const DIM_ATTR_RE =
  /&quot;id&quot;:\[0,&quot;(length|wheelbase|width|height)&quot;\][\s\S]{0,280}?&quot;value&quot;:\[0,&quot;([^&]*)&quot;\]/g;

/** Schema: Length 7, Width excl 8, Width incl 9, Height 10, Wheelbase 11 */
function mapDeIdToFactId(id: string): number | null {
  switch (id) {
    case "length":
      return 7;
    case "wheelbase":
      return 11;
    case "width":
      return 9;
    case "height":
      return 10;
    default:
      return null;
  }
}

export function parsePorscheGermanyDimensionMap(
  html: string,
): Map<string, Record<number, number>> {
  const byDerivate = new Map<string, Record<number, number>>();
  const positions: { code: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(DERIVATE_RE.source, "g");
  while ((m = re.exec(html)) !== null) {
    positions.push({ code: m[1], index: m.index });
  }

  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].index;
    const end =
      i + 1 < positions.length
        ? positions[i + 1].index
        : Math.min(html.length, start + 40_000);
    const chunk = html.slice(start, end);
    const facts: Record<number, number> = {};
    let dm: RegExpExecArray | null;
    const rdim = new RegExp(DIM_ATTR_RE.source, "g");
    while ((dm = rdim.exec(chunk)) !== null) {
      const fid = mapDeIdToFactId(dm[1]);
      if (fid === null) continue;
      const meters = germanMmDimensionToMeters(dm[2]);
      if (meters !== null) facts[fid] = meters;
    }
    if (Object.keys(facts).length > 0) {
      byDerivate.set(positions[i].code, facts);
    }
  }

  return byDerivate;
}

/** DE URLs to try for static dimensions (after Sweden overview). */
export function buildPorscheGermanyDimensionFetchUrls(
  modelRangeId: string,
  swedenOverviewUrl: string,
): string[] {
  const id = modelRangeId.toLowerCase();
  const urls: string[] = [];
  const paths = PORSCHE_DE_DIMENSION_PATHS[id];
  if (paths) {
    for (const p of paths) {
      urls.push(`${PORSCHE_DE_MODELS_BASE}${p}`);
    }
  }
  if (/porsche\.com\/sweden\//i.test(swedenOverviewUrl)) {
    urls.push(swedenOverviewUrl.replace(/\/sweden\//i, "/germany/"));
    urls.push(swedenOverviewUrl.replace(/\/sweden\//i, "/usa/"));
  }
  return [...new Set(urls)];
}

const DIMENSION_FACT_IDS = [7, 8, 9, 10, 11] as const;

function isFactEmpty(v: unknown): boolean {
  return v === null || v === undefined || v === "";
}

/**
 * Fills only missing dimension facts from DE map; never overwrites Sweden values.
 * When the DE page has a single `derivateCode` block (common for one shared body),
 * those dimensions are applied to every variant still missing facts after an exact
 * derivate match — appropriate for platform-wide L/W/H/wheelbase.
 */
export function mergePorscheGermanyDimensionsIntoVariants(
  variants: CarVariant[],
  byDerivate: Map<string, Record<number, number>>,
  deSourceUrl: string,
): void {
  const soleEntry =
    byDerivate.size === 1
      ? ([...byDerivate.entries()][0] as [string, Record<number, number>])
      : null;

  for (const row of variants) {
    const code = row.oemInternal?.porscheDerivateCode;
    let dims = code ? byDerivate.get(code) : undefined;
    let usedSharedSole = false;
    if (!dims && soleEntry) {
      dims = soleEntry[1];
      usedSharedSole = Boolean(code && code !== soleEntry[0]);
    }
    if (!dims) continue;

    let anyFilled = false;
    for (const fid of DIMENSION_FACT_IDS) {
      if (!isFactEmpty(row.facts[fid])) continue;
      const val = dims[fid];
      if (val === undefined) continue;
      row.facts[fid] = val;
      row.fieldSources[fid] = deSourceUrl;
      anyFilled = true;
    }
    if (!anyFilled) continue;

    if (!row.sourceUrlsSupporting.includes(deSourceUrl)) {
      row.sourceUrlsSupporting.push(deSourceUrl);
    }
    if (usedSharedSole && soleEntry) {
      row.extractionNotes.push(
        `Dimensions (facts 7–11) from Porsche Germany shared body block (${soleEntry[0]}); DE page lists one derivate for all ${row.facts[2] ?? "model"} variants: ${deSourceUrl}`,
      );
    } else {
      row.extractionNotes.push(
        `Dimensions (facts 7–11) filled from Porsche Germany static page when missing: ${deSourceUrl}`,
      );
    }
  }
}
