/** Whitespace and light normalisation for Swedish source strings (full numeric rules in Prompt 6). */

export function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

export function normaliseLabelKey(label: string): string {
  return collapseWhitespace(label).toLowerCase();
}
