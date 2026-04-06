import type { CarVariant } from "../../models/types";
import { normalisePrice, parseRangeValue } from "../../extraction/normaliser";

export interface PorscheOverviewParseContext {
  sourceUrl: string;
  retrievalDate: string;
  /** Lowercase slug from URL, e.g. macan, 911, taycan */
  modelRangeId: string;
}

const CARD_START_RE =
  /&quot;id&quot;:\[0,&quot;([A-Z0-9]+-\d{4})&quot;\],&quot;model&quot;:\[0,\{/g;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function specificationFromNames(modelRange: string, modelName: string): string {
  const re = new RegExp(`^${escapeRegExp(modelRange)}\\s*`, "i");
  return modelName.replace(re, "").trim();
}

function parseGearbox(chunk: string): string {
  if (/&quot;PDK&quot;/.test(chunk) || /\bPDK\b/.test(chunk)) return "PDK";
  if (/Tiptronic/i.test(chunk)) return "Tiptronic S";
  if (/&quot;Manuell&quot;/.test(chunk) || /\bManuell\b/.test(chunk)) return "Manuell";
  return "Automatisk";
}

function driveLayoutAndAwd(wheelDrive: string): { layout: string; awd: 0 | 1 } {
  const w = wheelDrive.toLowerCase();
  if (
    w.includes("fyrhjuls") ||
    w.includes("awd") ||
    w.includes("4matic") ||
    w.includes("allrad") ||
    w.includes("all-wheel")
  ) {
    return { layout: "AWD", awd: 1 };
  }
  if (
    w.includes("bakhjul") ||
    w.includes("rwd") ||
    w.includes("heckantrieb") ||
    w.includes("rear-wheel")
  ) {
    return { layout: "RWD", awd: 0 };
  }
  if (w.includes("framhjuls") || w.includes("fwd") || w.includes("frontantrieb")) {
    return { layout: "FWD", awd: 0 };
  }
  return { layout: wheelDrive || "", awd: 0 };
}

function parseDisclaimer(chunk: string): {
  electricConsumptionWorst: number | null;
  rangeLow: number | null;
  co2: number | null;
  fuelCombinedWorst: number | null;
} {
  const el = chunk.match(
    /Elektrisk förbrukning blandad \(modellserie\):\s*(\d+,\d+)\s*–\s*(\d+,\d+)\s*kWh\/100 km,\s*Räckvidd kombinerad \(WLTP\):\s*(\d+)\s*–\s*(\d+)\s*km,\s*CO2-utsläpp blandad \(modellserie\):\s*(\d+)\s*g\/km/,
  );
  if (el) {
    const cons = parseRangeValue(`${el[1]} – ${el[2]} kWh`);
    const rangeLow = Number(el[3].replace(",", ".")) || Number(el[3]);
    const co2 = Number(el[5]);
    return {
      electricConsumptionWorst: cons.low,
      rangeLow: Number.isFinite(rangeLow) ? rangeLow : null,
      co2: Number.isFinite(co2) ? co2 : null,
      fuelCombinedWorst: null,
    };
  }
  const ice = chunk.match(
    /Förbrukning blandad \(modellserie\):\s*(\d+,\d+)\s*–\s*(\d+,\d+)\s*l\/100 km,\s*CO2-utsläpp blandad \(modellserie\):\s*(\d+)\s*–\s*(\d+)\s*g\/km/,
  );
  if (ice) {
    const fuel = parseRangeValue(`${ice[1]} – ${ice[2]} l`);
    const co2r = parseRangeValue(`${ice[3]} – ${ice[4]} g`);
    return {
      electricConsumptionWorst: null,
      rangeLow: null,
      co2: co2r.low,
      fuelCombinedWorst: fuel.low,
    };
  }
  return {
    electricConsumptionWorst: null,
    rangeLow: null,
    co2: null,
    fuelCombinedWorst: null,
  };
}

function parseTechnical(chunk: string): {
  accel: string | null;
  kw: number | null;
  hp: number | null;
  topSpeed: number | null;
} {
  const techIdx = chunk.indexOf("&quot;technicalData&quot;");
  const techChunk =
    techIdx >= 0 ? chunk.slice(techIdx, techIdx + 8000) : chunk;
  const accelM = techChunk.match(/&quot;(\d+,\d+)\s*s&quot;/);
  const accel = accelM ? accelM[1].replace(",", ".") + " s" : null;
  const kwM = techChunk.match(/&quot;(\d+)\s*kW&quot;/i);
  const hkM =
    techChunk.match(/&quot;(\d+)\s*HK&quot;/i) ||
    techChunk.match(/&quot;(\d+)\s*hk&quot;/i);
  const tsM = techChunk.match(/&quot;(\d+)\s*km\/h&quot;/i);
  return {
    accel,
    kw: kwM ? Number(kwM[1]) : null,
    hp: hkM ? Number(hkM[1]) : null,
    topSpeed: tsM ? Number(tsM[1]) : null,
  };
}

/**
 * Parses Porsche Sweden model family overview HTML (Astro + embedded model cards).
 */
export function parsePorscheModelOverviewHtml(
  html: string,
  ctx: PorscheOverviewParseContext,
): Partial<CarVariant>[] {
  const rangeNeedle = `&quot;modelRangeId&quot;:[0,&quot;${ctx.modelRangeId}&quot;]`;
  const matches: { id: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(CARD_START_RE.source, "g");
  while ((m = re.exec(html)) !== null) {
    matches.push({ id: m[1], index: m.index });
  }

  const variants: Partial<CarVariant>[] = [];

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : html.length;
    const chunk = html.slice(start, end);
    if (!chunk.includes(rangeNeedle)) continue;

    const modelNameM = chunk.match(/&quot;modelName&quot;:\[0,&quot;([^&]*)&quot;\]/);
    const modelRangeM = chunk.match(/&quot;modelRange&quot;:\[0,&quot;([^&]*)&quot;\]/);
    const modelTypeM = chunk.match(/&quot;modelType&quot;:\[0,&quot;([A-Z0-9]+)&quot;\]/);
    const wheelDriveM = chunk.match(/&quot;wheelDrive&quot;:\[0,&quot;([^&]*)&quot;\]/);
    const fuelTextM = chunk.match(/&quot;fuelTypeText&quot;:\[0,&quot;([^&]*)&quot;\]/);

    if (!modelNameM || !modelRangeM) continue;

    const modelName = modelNameM[1];
    const modelRange = modelRangeM[1];
    const wheelDrive = wheelDriveM?.[1] ?? "";
    const fuelText = fuelTextM?.[1] ?? "";

    const priceRaw = chunk.match(/Från\s*[\d\u00a0\s]+kr/);
    const priceNum = priceRaw ? normalisePrice(priceRaw[0]) : null;

    const tech = parseTechnical(chunk);
    const disc = parseDisclaimer(chunk);
    const { layout, awd } = driveLayoutAndAwd(wheelDrive);
    const gearbox = parseGearbox(chunk);

    let powerplant = "";
    if (tech.kw != null) {
      powerplant =
        fuelText.toLowerCase() === "elektrisk"
          ? `Elektrisk ${tech.kw} kW`
          : `${fuelText} ${tech.kw} kW`.trim();
    } else if (fuelText) {
      powerplant = fuelText;
    }

    const spec = specificationFromNames(modelRange, modelName);
    const facts: Record<number, unknown> = {
      1: "Porsche",
      2: modelRange,
      3: spec,
      4: powerplant,
      5: gearbox,
      43: fuelText || null,
      46: tech.kw,
      47: tech.hp,
      55: gearbox,
      58: layout,
      60: tech.accel,
      63: tech.topSpeed,
      68: disc.fuelCombinedWorst,
      72: disc.electricConsumptionWorst,
      73: disc.co2,
      40: disc.rangeLow,
      121: priceNum,
      129: awd,
    };

    const notes: string[] = [
      "Porsche Sweden overview card; power/accel from Overboost/Launch Control where stated in source.",
    ];
    if (fuelText.toLowerCase() === "elektrisk") {
      notes.push("WLTP range uses lower bound of stated interval; consumption uses worse (first) kWh/100 km value.");
    }

    const uniqueKey = [
      "Porsche",
      modelRange,
      powerplant || "unknown-powerplant",
      gearbox,
      spec || "base",
      "",
      "",
    ].join("|");

    variants.push({
      facts,
      uniqueKey,
      sourceUrlMain: ctx.sourceUrl,
      sourceUrlsSupporting: [],
      retrievalDate: ctx.retrievalDate,
      extractionNotes: notes,
      confidence: 82,
      fieldSources: Object.fromEntries(
        Object.keys(facts)
          .filter((k) => facts[Number(k)] != null && facts[Number(k)] !== "")
          .map((k) => [Number(k), ctx.sourceUrl]),
      ),
      oemInternal: modelTypeM?.[1]
        ? { porscheDerivateCode: modelTypeM[1] }
        : undefined,
    });
  }

  return variants;
}

export function derivePorscheModelRangeIdFromUrl(url: string): string {
  const m = url.match(/\/models\/([^/?#]+)/i);
  return (m?.[1] ?? "").toLowerCase();
}
