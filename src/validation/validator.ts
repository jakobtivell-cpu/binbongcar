import type { CarVariant } from "../models/types";

export interface ValidationOutcome {
  ok: boolean;
  confidence: number;
  warnings: string[];
}

export function validateVariant(_v: CarVariant): ValidationOutcome {
  return { ok: true, confidence: 100, warnings: [] };
}
