import { Command } from "commander";
import { runPipeline } from "./pipeline";
import type { CliOptions } from "./models/types";
import { rootLogger } from "./utils/logger";

export async function runCli(argv: string[]): Promise<void> {
  const program = new Command();
  program
    .name("scrape")
    .description("Swedish OEM car product data scraper")
    .option("--oem <id>", "Run a single OEM id (e.g. bmw-se)")
    .option("--model <name>", "Filter to a single model name/id substring")
    .option("--force", "Bypass disk cache", false)
    .option("--slow", "Double HTTP backoff delays", false)
    .option("--verbose", "Debug logging", false)
    .option("--dry-run", "Load configs and log plan only", false);

  program.parse(argv);
  const o = program.opts<{
    oem?: string;
    model?: string;
    force?: boolean;
    slow?: boolean;
    verbose?: boolean;
    dryRun?: boolean;
  }>();

  const opts: CliOptions = {
    oem: o.oem,
    model: o.model,
    force: Boolean(o.force),
    slow: Boolean(o.slow),
    verbose: Boolean(o.verbose),
    dryRun: Boolean(o.dryRun),
  };

  if (opts.verbose) {
    rootLogger.setLevel("debug");
    process.env.LOG_LEVEL = "debug";
  }

  const summary = await runPipeline(opts);
  rootLogger.info(
    `Run complete: oems=[${summary.oemIds.join(", ")}] schema_v=${summary.schemaVersion} facts=${summary.factCount} csvCols=${summary.csvColumns} dryRun=${summary.dryRun}`,
  );
  if (Object.keys(summary.variantCounts).length > 0) {
    rootLogger.info(`Variant counts: ${JSON.stringify(summary.variantCounts)}`);
  }
  for (const p of summary.csvPaths) {
    rootLogger.info(`CSV: ${p}`);
  }
}
