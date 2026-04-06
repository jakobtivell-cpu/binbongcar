import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const csvPath =
  process.env.SCHEMA_CSV ||
  path.join(process.env.USERPROFILE || "", "Downloads", "Product_data_filled_updated.csv");

const raw = fs.readFileSync(csvPath, "utf8");
const line = raw.split(/\r?\n/)[0];
const cols = line.split(";");
const audit = ["source_url_main", "source_urls_supporting", "retrieval_date"];
const last3 = cols.slice(-3);
if (last3.join("|") !== audit.join("|")) {
  throw new Error(`Expected last 3 columns to be audit fields, got: ${last3.join(", ")}`);
}
const dataCols = cols.slice(0, -3);

function infer(factId, name) {
  if (factId >= 1 && factId <= 6) {
    return { unit_label: null, value_domain: "text", sql_type: "VARCHAR(512)" };
  }
  if (factId >= 125 && factId <= 182) {
    return { unit_label: null, value_domain: "boolean", sql_type: "TINYINT(1)" };
  }
  if (factId === 121) {
    return { unit_label: "SEK", value_domain: "currency", sql_type: "DECIMAL(14,2)" };
  }
  const lower = name.toLowerCase();
  if (
    /number of|count|doors|seats|cylinders|gears|airbag|isofix|usb ports|speaker/i.test(
      name,
    )
  ) {
    return { unit_label: null, value_domain: "integer", sql_type: "INT" };
  }
  if (
    /length|width|height|wheelbase|weight|volume|capacity|power|torque|speed|consumption|co2|range|acceleration|clearance|angle|circle|coefficient|diameter|rpm/i.test(
      lower,
    ) ||
    /kwh|kw|hp|l\/100|g\/km|km\/h| mpg|0–100|0-100|quarter mile/i.test(lower)
  ) {
    return { unit_label: null, value_domain: "numeric", sql_type: "DECIMAL(18,6)" };
  }
  return { unit_label: null, value_domain: "text", sql_type: "VARCHAR(512)" };
}

const fields = dataCols.map((fact_name, i) => {
  const fact_id = i + 1;
  return { fact_id, fact_name, ...infer(fact_id, fact_name) };
});

fs.mkdirSync(path.join(root, "data"), { recursive: true });
fs.writeFileSync(
  path.join(root, "data", "schema.json"),
  JSON.stringify({ version: 1, fields }, null, 2),
  "utf8",
);
console.log(`Wrote ${fields.length} fields to data/schema.json`);
