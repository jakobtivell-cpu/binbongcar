import type { CarVariant } from "../models/types";

/** Strip spaces and NBSP; Swedish decimal comma → dot. */
export function normaliseSwedishNumber(raw: string): number | null {
  const s = raw.replace(/\u00a0/g, " ").replace(/\s/g, "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** "Från 1 080 000kr" / "Från 960 000kr" → integer SEK */
export function normalisePrice(raw: string): number | null {
  const m = raw.match(/Från\s*([\d\u00a0\s]+)\s*kr/i);
  if (!m) return null;
  return normaliseSwedishNumber(m[1].replace(/\s/g, "").replace(/\u00a0/g, ""));
}

export function splitCombinedPower(combined: string): { kw: number | null; hp: number | null } {
  const kwM = combined.match(/(\d+)\s*kW/i);
  const hpM = combined.match(/(\d+)\s*HK/i) || combined.match(/(\d+)\s*hk/i);
  return {
    kw: kwM ? Number(kwM[1]) : null,
    hp: hpM ? Number(hpM[1]) : null,
  };
}

export interface RangeParse {
  low: number | null;
  high: number | null;
}

/** "524 – 612 km" or "20,4 – 17,7 kWh/100 km" → bounds (Swedish commas). */
export function parseRangeValue(raw: string): RangeParse {
  const m = raw.match(
    /(\d+(?:,\d+)?)\s*[–-]\s*(\d+(?:,\d+)?)/u,
  );
  if (!m) return { low: null, high: null };
  return {
    low: normaliseSwedishNumber(m[1]),
    high: normaliseSwedishNumber(m[2]),
  };
}

export function normaliseBoolean(_raw: string): 0 | 1 | null {
  return null;
}

/** Apply Swedish numeric normalisation to known Porsche overview facts. */
export function normalisePorscheOverviewFacts(
  facts: Record<number, unknown>,
): Record<number, unknown> {
  const out = { ...facts };
  const n60 = out[60];
  if (typeof n60 === "string") {
    const num = normaliseSwedishNumber(n60.replace(/\s*s\s*$/i, "").trim());
    if (num !== null) out[60] = num;
  }
  const n63 = out[63];
  if (typeof n63 === "string") {
    const m = n63.match(/(\d+(?:,\d+)?)/);
    if (m) {
      const num = normaliseSwedishNumber(m[1]);
      if (num !== null) out[63] = num;
    }
  }
  return out;
}

export function normaliseVariants(_variants: CarVariant[]): CarVariant[] {
  return _variants;
}
