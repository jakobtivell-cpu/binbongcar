import { createHash } from "crypto";

/**
 * Stable, deterministic id for a variant row within an OEM run.
 * Same OEM + same uniqueKey → same id across scrapes (until uniqueKey logic changes).
 */
export function buildVariantItemId(oemId: string, uniqueKey: string): string {
  const basis = uniqueKey.trim() || "unknown";
  const digest = createHash("sha256")
    .update(`${oemId}|${basis}`, "utf8")
    .digest("hex");
  return `${oemId}_${digest.slice(0, 16)}`;
}
