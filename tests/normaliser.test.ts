import {
  germanMmDimensionToMeters,
  normalisePrice,
  normaliseSwedishNumber,
  parseRangeValue,
  splitCombinedPower,
} from "../src/extraction/normaliser";

describe("normaliser (Porsche formats)", () => {
  it("normaliseSwedishNumber", () => {
    expect(normaliseSwedishNumber("1 080 000")).toBe(1080000);
    expect(normaliseSwedishNumber("4,1")).toBe(4.1);
    expect(normaliseSwedishNumber("20,4")).toBe(20.4);
  });

  it("normalisePrice", () => {
    expect(normalisePrice("Från 1 080 000kr")).toBe(1_080_000);
    expect(normalisePrice("Från 960 000kr")).toBe(960_000);
  });

  it("splitCombinedPower", () => {
    expect(splitCombinedPower("380 kW / 516 HK")).toEqual({
      kw: 380,
      hp: 516,
    });
  });

  it("germanMmDimensionToMeters (DE Porsche)", () => {
    expect(germanMmDimensionToMeters("4.784 mm")).toBe(4.784);
    expect(germanMmDimensionToMeters("2.893 mm")).toBe(2.893);
    expect(germanMmDimensionToMeters("1.624 mm")).toBe(1.624);
  });

  it("parseRangeValue", () => {
    expect(parseRangeValue("524 – 612 km")).toEqual({ low: 524, high: 612 });
    expect(parseRangeValue("20,4 – 17,7 kWh/100 km")).toEqual({
      low: 20.4,
      high: 17.7,
    });
  });
});
