# OEM Car Data Scraper (Sweden)

Node.js + TypeScript scraper for Swedish-market OEM passenger car product data. Cheerio-first HTML parsing, optional Playwright for JS-heavy sites, `pdf-parse` for PDFs.

## Quick start

```bash
npm install
npx ts-node scrape.ts --help
npx ts-node scrape.ts --dry-run
npx tsc --noEmit
npx jest
```

## Layout

- `data/schema.json` — 183 output fields (`fact_id` 1–182 from the source CSV plus **183 Variant item ID**); regenerate the first 182 via `node scripts/generate-schema-from-csv.mjs` if the CSV header changes, then keep `fact_id` 183 appended.
- `data/oem-registry.json` — enabled OEMs and config paths.
- `data/oems/*.json` — per-OEM model URLs and fetch hints.
- `data/translations/sv-to-schema.json` — Swedish label → `fact_id`.
- `src/` — pipeline modules (fetch, parse, normalise, validate, output).

**Status:** Prompt 1 scaffold — fetchers, parsers, and writers are stubs; pipeline loads configs only.

## Schema generation

Set `SCHEMA_CSV` to point at a CSV whose first row has 182 product columns followed by `source_url_main`, `source_urls_supporting`, `retrieval_date` (the scraper adds `fact_id` **183** for a stable variant item id in exports):

```bash
set SCHEMA_CSV=C:\path\to\Product_data_filled_updated.csv
node scripts/generate-schema-from-csv.mjs
```
