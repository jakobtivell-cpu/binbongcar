/**
 * Card-style model grids (Porsche Sweden family overviews).
 * OEM-specific implementation lives in `oem/porsche-se.ts`; parser-manager routes here conceptually.
 */
export {
  parsePorscheModelOverviewHtml,
  derivePorscheModelRangeIdFromUrl,
} from "./oem/porsche-se";
