import type { CarVariant } from "../models/types";
import { normalisePorscheOverviewFacts } from "./normaliser";

export function finalizeCarVariant(
  partial: Partial<CarVariant>,
  fallbackRetrievalDate: string,
): CarVariant {
  const facts = normalisePorscheOverviewFacts({ ...(partial.facts ?? {}) });
  return {
    facts,
    uniqueKey: partial.uniqueKey ?? "",
    sourceUrlMain: partial.sourceUrlMain ?? "",
    sourceUrlsSupporting: partial.sourceUrlsSupporting ?? [],
    retrievalDate: partial.retrievalDate || fallbackRetrievalDate,
    extractionNotes: partial.extractionNotes ?? [],
    confidence: partial.confidence ?? 70,
    fieldSources: partial.fieldSources ?? {},
    oemInternal: partial.oemInternal,
  };
}
