import { loadOemConfig, loadOemRegistry } from "./config/oem-loader";
import { finalizeCarVariant } from "./extraction/finalize-variant";
import { fetchPage } from "./fetchers/fetch-manager";
import { writeOemCsvFile } from "./output/csv-writer";
import type { CarVariant, CliOptions } from "./models/types";
import { parseFetchedPage } from "./parsers/parser-manager";
import { SchemaRegistry } from "./models/schema-registry";
import { rootLogger } from "./utils/logger";

export interface PipelineRunSummary {
  oemIds: string[];
  schemaVersion: number;
  factCount: number;
  csvColumns: number;
  dryRun: boolean;
  csvPaths: string[];
  variantCounts: Record<string, number>;
}

function formatVariantLogLine(v: CarVariant): string {
  const msrp = v.facts[121];
  const hp = v.facts[47];
  const acc = v.facts[60];
  const spec = v.facts[3] ?? "";
  return `MSRP: ${msrp ?? "—"}, Power: ${hp ?? "—"} HK, 0-100: ${acc ?? "—"}s, Spec: ${spec || "(base)"}`;
}

export async function runPipeline(opts: CliOptions): Promise<PipelineRunSummary> {
  const log = rootLogger;
  const rootDir = process.cwd();
  const registry = SchemaRegistry.loadDefault(rootDir);
  const reg = loadOemRegistry(rootDir);
  const retrievalDate = new Date().toISOString().slice(0, 10);

  const enabled = reg.oems.filter((o) => o.enabled);
  const selected = opts.oem
    ? enabled.filter((o) => o.id === opts.oem)
    : enabled;

  if (opts.oem && selected.length === 0) {
    log.warn(`No enabled OEM matches --oem ${opts.oem}`);
  }

  const csvPaths: string[] = [];
  const variantCounts: Record<string, number> = {};

  for (const entry of selected) {
    const cfg = loadOemConfig(entry.configFile, rootDir);
    const models = cfg.models.filter((m) =>
      opts.model ? m.modelName.includes(opts.model) || m.id === opts.model : true,
    );
    log.info(
      `OEM ${entry.id}: brand=${cfg.brand} models=${models.length}/${cfg.models.length} (config=${entry.configFile})`,
    );

    const oemVariants: CarVariant[] = [];

    for (const m of models) {
      const label = opts.dryRun ? "[dry-run]" : "[plan]";
      log.info(`  ${label} ${m.modelName} pages=${m.pages.length}`);
      for (const p of m.pages) {
        log.info(`    - ${p.role} ${p.strategy} ${p.url}`);
      }

      if (opts.dryRun) continue;

      for (const p of m.pages) {
        const res = await fetchPage(p, {
          oemId: entry.id,
          modelName: m.modelName,
          force: opts.force,
          slow: opts.slow,
        });
        const len =
          res.content === null || res.content === undefined
            ? 0
            : typeof res.content === "string"
              ? res.content.length
              : res.content.length;
        if (res.error) {
          log.warn(
            `    [${m.modelName}] ${p.role}: ${res.fetchMethod} — ${res.error}`,
          );
        } else {
          log.info(
            `    [${m.modelName}] ${p.role}: ${res.fetchMethod} OK bytes=${len} type=${res.contentType}`,
          );
        }

        const partials = parseFetchedPage(entry.id, p, res, {
          retrievalDate,
        });
        if (partials.length > 0) {
          log.info(
            `    [${m.modelName}] Parsed ${partials.length} variant(s) from ${p.role} page`,
          );
        }
        for (const partial of partials) {
          const v = finalizeCarVariant(partial, retrievalDate);
          oemVariants.push(v);
          if (opts.verbose) {
            log.info(
              `    [${m.modelName}] Variant: ${v.facts[2] ?? ""} ${v.facts[3] ? String(v.facts[3]) : "(base)"} — ${formatVariantLogLine(v)}`,
            );
          }
        }
      }
    }

    variantCounts[entry.id] = oemVariants.length;

    if (!opts.dryRun && oemVariants.length > 0) {
      const out = writeOemCsvFile(entry.id, oemVariants, registry, rootDir);
      csvPaths.push(out);
      log.info(`Wrote ${oemVariants.length} rows → ${out}`);
    }
  }

  return {
    oemIds: selected.map((s) => s.id),
    schemaVersion: registry.getVersion(),
    factCount: registry.getAllFactIds().length,
    csvColumns: registry.getFullCsvHeader().length,
    dryRun: opts.dryRun,
    csvPaths,
    variantCounts,
  };
}
