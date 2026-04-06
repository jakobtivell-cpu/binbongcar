import * as fs from "fs";
import * as path from "path";
import { stringify } from "csv-stringify/sync";
import type { CarVariant } from "../models/types";
import { SchemaRegistry } from "../models/schema-registry";

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
    return String(value);
  }
  return String(value);
}

/**
 * Writes one CSV per OEM run: 183 schema columns + 3 audit, UTF-8 BOM, comma-separated.
 */
export function writeOemCsvFile(
  oemId: string,
  variants: CarVariant[],
  registry: SchemaRegistry,
  rootDir: string = process.cwd(),
): string {
  const date = new Date().toISOString().slice(0, 10);
  const outDir = path.join(rootDir, "output");
  fs.mkdirSync(outDir, { recursive: true });
  const filePath = path.join(outDir, `${oemId}_${date}.csv`);

  const factIds = registry.getAllFactIds();
  const headers = registry.getFullCsvHeader();

  const rows: string[][] = variants.map((v) => {
    const row: string[] = [];
    for (const id of factIds) {
      row.push(formatCell(v.facts[id]));
    }
    row.push(formatCell(v.sourceUrlMain));
    row.push(formatCell(v.sourceUrlsSupporting.join(" ").trim()));
    row.push(formatCell(v.retrievalDate));
    return row;
  });

  const csvBody = stringify([headers, ...rows], {
    quoted: true,
    quoted_empty: false,
    record_delimiter: "\n",
  });
  const bom = "\ufeff";
  fs.writeFileSync(filePath, bom + csvBody, "utf8");
  return filePath;
}
