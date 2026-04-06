import * as fs from "fs";
import * as path from "path";
import { parsePorscheModelOverviewHtml } from "../src/parsers/oem/porsche-se";

const fixturePath = path.join(
  __dirname,
  "fixtures",
  "porsche-se",
  "macan-overview.html",
);

describe("parsePorscheModelOverviewHtml (Macan fixture)", () => {
  it("returns 5 Macan variants with Macan 4S price and power", () => {
    const html = fs.readFileSync(fixturePath, "utf8");
    const variants = parsePorscheModelOverviewHtml(html, {
      sourceUrl: "https://www.porsche.com/sweden/models/macan/",
      retrievalDate: "2026-04-06",
      modelRangeId: "macan",
    });
    expect(variants).toHaveLength(5);

    const fourS = variants.find((v) => v.facts?.[3] === "4S");
    expect(fourS).toBeDefined();
    expect(fourS!.facts![121]).toBe(1_080_000);
    expect(fourS!.facts![47]).toBe(516);
    expect(fourS!.facts![46]).toBe(380);
    expect(fourS!.facts![60]).toBe("4.1 s");

    const base = variants.find((v) => v.facts?.[3] === "");
    expect(base).toBeDefined();
    expect(base!.facts![121]).toBe(960_000);
  });
});
