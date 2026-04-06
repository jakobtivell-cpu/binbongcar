import fs from "fs";
import { parse } from "csv-parse/sync";

const path = process.argv[2] || "output/porsche-se_2026-04-06.csv";
const raw = fs.readFileSync(path, "utf8");
const records = parse(raw, {
  columns: true,
  skip_empty_lines: true,
  relax_column_count: true,
  bom: true,
});
const cols = Object.keys(records[0] || {});
console.log("columnCount", cols.length);
console.log("first3Headers", cols.slice(0, 3).join(" | "));
const msrpKey = cols.find((c) => c.includes("MSRP")) || "";
console.log("msrpKey", msrpKey);
const fourS = records.find(
  (r) => r["Specification"] === "4S" && r["Model"] === "Macan",
);
console.log("Macan 4S MSRP", fourS?.[msrpKey]);
console.log("firstRowSpec", records[0]?.["Specification"], records[0]?.["Model"]);
