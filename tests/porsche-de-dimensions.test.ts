import type { CarVariant } from "../src/models/types";
import {
  buildPorscheGermanyDimensionFetchUrls,
  mergePorscheGermanyDimensionsIntoVariants,
  parsePorscheGermanyDimensionMap,
} from "../src/parsers/oem/porsche-de-dimensions";

const SNIPPET = `derivateCode&quot;:[0,&quot;XABDC1&quot;],&quot;technicalData&quot;:[0,{&quot;attributes&quot;:[1,[[0,{&quot;id&quot;:[0,&quot;height&quot;],&quot;label&quot;:[0,&quot;H\u00f6he&quot;],&quot;value&quot;:[0,&quot;1.624 mm&quot;]}],[0,{&quot;id&quot;:[0,&quot;length&quot;],&quot;label&quot;:[0,&quot;L\u00e4nge&quot;],&quot;value&quot;:[0,&quot;4.784 mm&quot;]}],[0,{&quot;id&quot;:[0,&quot;wheelbase&quot;],&quot;value&quot;:[0,&quot;2.893 mm&quot;]}],[0,{&quot;id&quot;:[0,&quot;width&quot;],&quot;value&quot;:[0,&quot;1.938 mm&quot;]}]]]}]}`;

describe("buildPorscheGermanyDimensionFetchUrls", () => {
  it("adds Germany and USA swaps for Sweden overview URLs", () => {
    const urls = buildPorscheGermanyDimensionFetchUrls(
      "911",
      "https://www.porsche.com/sweden/models/911/",
    );
    expect(urls.some((u) => u.includes("/germany/"))).toBe(true);
    expect(urls.some((u) => u.includes("/usa/"))).toBe(true);
  });
});

describe("parsePorscheGermanyDimensionMap", () => {
  it("parses derivateCode block into fact ids (meters)", () => {
    const map = parsePorscheGermanyDimensionMap(SNIPPET);
    expect(map.get("XABDC1")).toEqual({
      7: 4.784,
      9: 1.938,
      10: 1.624,
      11: 2.893,
    });
  });

  it("merge fills only empty dimension slots", () => {
    const row: CarVariant = {
      facts: { 7: 9.99 },
      uniqueKey: "k",
      sourceUrlMain: "https://sweden",
      sourceUrlsSupporting: [],
      retrievalDate: "2026-04-06",
      extractionNotes: [],
      confidence: 80,
      fieldSources: {},
      oemInternal: { porscheDerivateCode: "XABDC1" },
    };
    const map = parsePorscheGermanyDimensionMap(SNIPPET);
    mergePorscheGermanyDimensionsIntoVariants([row], map, "https://germany/de");
    expect(row.facts[7]).toBe(9.99);
    expect(row.facts[11]).toBe(2.893);
    expect(row.fieldSources[11]).toBe("https://germany/de");
  });

  it("single DE derivate fills other trims (shared body)", () => {
    const map = parsePorscheGermanyDimensionMap(SNIPPET);
    expect(map.size).toBe(1);
    const other: CarVariant = {
      facts: {},
      uniqueKey: "k2",
      sourceUrlMain: "https://sweden",
      sourceUrlsSupporting: [],
      retrievalDate: "2026-04-06",
      extractionNotes: [],
      confidence: 80,
      fieldSources: {},
      oemInternal: { porscheDerivateCode: "XABFD1" },
    };
    mergePorscheGermanyDimensionsIntoVariants([other], map, "https://germany/de");
    expect(other.facts[7]).toBe(4.784);
    expect(other.extractionNotes.some((n) => n.includes("shared body"))).toBe(true);
  });
});
