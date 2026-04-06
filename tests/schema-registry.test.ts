import * as path from "path";
import { SchemaRegistry } from "../src/models/schema-registry";
import { CSV_COLUMN_COUNT } from "../src/models/types";

const root = path.resolve(__dirname, "..");

describe("SchemaRegistry", () => {
  it("loads 183 facts and 186 CSV columns with audit keys", () => {
    const reg = SchemaRegistry.loadDefault(root);
    expect(reg.getAllFactIds()).toHaveLength(183);
    expect(reg.getFullCsvHeader()).toHaveLength(CSV_COLUMN_COUNT);
    expect(CSV_COLUMN_COUNT).toBe(186);
  });

  it("lookupByFactId and lookupByName work", () => {
    const reg = SchemaRegistry.loadDefault(root);
    expect(reg.lookupByFactId(1)?.fact_name).toBe("Make");
    expect(reg.lookupByName("make")?.fact_id).toBe(1);
  });

  it("getColumnOrder matches fact_id sort", () => {
    const reg = SchemaRegistry.loadDefault(root);
    const order = reg.getColumnOrder();
    expect(order[0]).toBe("Make");
    expect(order[121 - 1]).toMatch(/MSRP/i);
    expect(order[182]).toMatch(/Variant item ID/i);
  });
});
