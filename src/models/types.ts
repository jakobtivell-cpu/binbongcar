/**
 * Shared types for the OEM scraper pipeline. Runtime validation (Zod) can be layered in Prompt 2.
 */

export type FetchStrategy = "static" | "js" | "pdf" | "api";

export type PageRole = "overview" | "specs" | "price" | "equipment" | "pdf";

export interface SpecField {
  fact_id: number;
  fact_name: string;
  unit_label: string | null;
  value_domain: string;
  sql_type: string;
}

export interface PageEntry {
  url: string;
  role: PageRole;
  strategy: FetchStrategy;
  jsWaitSelector?: string;
  jsonPaths?: string[];
  note?: string;
}

export interface ModelEntry {
  id: string;
  modelName: string;
  modelCode?: string;
  bodyType?: string;
  pages: PageEntry[];
  variants?: string[];
  parsingHints?: Record<string, unknown>;
}

export interface FetchDefaults {
  strategy: FetchStrategy;
  jsWaitSelector?: string;
  jsWaitTimeout?: number;
  headers?: Record<string, string>;
}

export interface OEMConfig {
  oemId: string;
  brand: string;
  country: string;
  language?: string;
  currency?: string;
  baseUrl: string;
  vatIncluded?: boolean;
  fetchDefaults: FetchDefaults;
  models: ModelEntry[];
}

export interface OEMRegistryEntry {
  id: string;
  configFile: string;
  enabled: boolean;
}

export interface OEMRegistryFile {
  oems: OEMRegistryEntry[];
}

export type FetchMethod = "static" | "js" | "pdf" | "api" | "cache";

export interface FetchResult {
  url: string;
  content: string | Buffer | null;
  contentType: string;
  fetchMethod: FetchMethod;
  timestamp: string;
  cachedPath?: string;
  interceptedJson?: unknown;
  error?: string;
}

/** OEM-specific merge keys — not written to CSV. */
export interface CarVariantOemInternal {
  /** Porsche internal model / derivate code (e.g. XABDC1) for DE static data merge. */
  porscheDerivateCode?: string;
}

/** One marketed variant row (full shape filled in later prompts). */
export interface CarVariant {
  facts: Record<number, unknown>;
  uniqueKey: string;
  sourceUrlMain: string;
  sourceUrlsSupporting: string[];
  retrievalDate: string;
  extractionNotes: string[];
  confidence: number;
  fieldSources: Record<number, string>;
  /** Optional; used for cross-market static merge (e.g. Porsche DE dimensions). */
  oemInternal?: CarVariantOemInternal;
}

export interface CliOptions {
  oem?: string;
  model?: string;
  force: boolean;
  slow: boolean;
  verbose: boolean;
  dryRun: boolean;
}

export const AUDIT_COLUMN_KEYS = [
  "source_url_main",
  "source_urls_supporting",
  "retrieval_date",
] as const;

export type AuditColumnKey = (typeof AUDIT_COLUMN_KEYS)[number];

/** 183 schema facts (182 product + item id) + 3 audit columns — see data/schema.json */
export const CSV_COLUMN_COUNT = 183 + AUDIT_COLUMN_KEYS.length;
