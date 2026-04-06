import { buildVariantItemId } from "../src/utils/variant-item-id";

describe("buildVariantItemId", () => {
  it("is stable for same oem + uniqueKey", () => {
    expect(buildVariantItemId("porsche-se", "a|b|c")).toBe(
      buildVariantItemId("porsche-se", "a|b|c"),
    );
  });

  it("differs when uniqueKey differs", () => {
    expect(buildVariantItemId("porsche-se", "a")).not.toBe(
      buildVariantItemId("porsche-se", "b"),
    );
  });

  it("uses oem prefix and hex suffix", () => {
    const id = buildVariantItemId("porsche-se", "Porsche|Macan|x");
    expect(id).toMatch(/^porsche-se_[a-f0-9]{16}$/);
  });
});
