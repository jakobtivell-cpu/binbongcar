import * as fs from "fs";
import * as path from "path";
import type { SpecField } from "./types";
import { AUDIT_COLUMN_KEYS } from "./types";

export interface SchemaJson {
  version: number;
  fields: SpecField[];
}

function normaliseName(name: string): string {
  return name.trim().toLowerCase();
}

export class SchemaRegistry {
  private readonly fieldsById: Map<number, SpecField>;
  private readonly fieldsByName: Map<string, SpecField>;

  constructor(private readonly data: SchemaJson) {
    this.fieldsById = new Map();
    this.fieldsByName = new Map();
    for (const f of data.fields) {
      this.fieldsById.set(f.fact_id, f);
      this.fieldsByName.set(normaliseName(f.fact_name), f);
    }
  }

  static loadFromFile(filePath: string): SchemaRegistry {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as SchemaJson;
    if (!parsed.fields || !Array.isArray(parsed.fields)) {
      throw new Error(`Invalid schema.json: missing fields array at ${filePath}`);
    }
    return new SchemaRegistry(parsed);
  }

  /** Default: project root `data/schema.json` when cwd is repo root. */
  static loadDefault(rootDir: string = process.cwd()): SchemaRegistry {
    return SchemaRegistry.loadFromFile(path.join(rootDir, "data", "schema.json"));
  }

  lookupByFactId(id: number): SpecField | undefined {
    return this.fieldsById.get(id);
  }

  lookupByName(name: string): SpecField | undefined {
    return this.fieldsByName.get(normaliseName(name));
  }

  getAllFactIds(): number[] {
    return [...this.fieldsById.keys()].sort((a, b) => a - b);
  }

  /** fact_name values in fact_id order (183 schema columns). */
  getColumnOrder(): string[] {
    return this.getAllFactIds().map((id) => {
      const f = this.fieldsById.get(id);
      if (!f) throw new Error(`Missing field for fact_id ${id}`);
      return f.fact_name;
    });
  }

  /** Full CSV header row: 183 schema names + 3 audit keys. */
  getFullCsvHeader(): string[] {
    return [...this.getColumnOrder(), ...AUDIT_COLUMN_KEYS];
  }

  getVersion(): number {
    return this.data.version;
  }
}
