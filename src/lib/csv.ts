/** A parsed CSV row: cell values by header name, plus the line it started on (for error messages). */
export type CsvRow = Record<string, string> & { __line: string };

/**
 * RFC 4180 CSV parser: quoted fields may contain commas, line breaks and doubled quotes ("").
 * Handles a UTF-8 byte-order mark and Windows line endings, skips blank lines and trims cells.
 */
export function parseCsv(text: string): { line: number; cells: string[] }[] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows: { line: number; cells: string[] }[] = [];
  let cells: string[] = [], field = "", inQuotes = false, line = 1, rowLine = 1, quotedOpenLine = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else if (c === "\r") {
        // keep line breaks inside quotes as \n
      } else {
        if (c === "\n") line++;
        field += c;
      }
      continue;
    }
    if (c === '"' && field.trim() === "") { inQuotes = true; field = ""; quotedOpenLine = line; }
    else if (c === ",") { cells.push(field); field = ""; }
    else if (c === "\r") { /* skip */ }
    else if (c === "\n") { cells.push(field); rows.push({ line: rowLine, cells }); cells = []; field = ""; line++; rowLine = line; }
    else field += c;
  }
  if (inQuotes) throw new Error(`a quoted cell that starts on line ${quotedOpenLine} is never closed (missing ")`);
  if (field !== "" || cells.length) { cells.push(field); rows.push({ line: rowLine, cells }); }
  return rows
    .map((r) => ({ line: r.line, cells: r.cells.map((s) => s.trim()) }))
    .filter((r) => r.cells.some((s) => s !== ""));
}

/** Parses a CSV whose first row is a header. Column names are matched case-insensitively. */
export function readCsvTable(text: string, file: string, required: string[]): CsvRow[] {
  const rows = parseCsv(text);
  if (!rows.length) throw new Error(`${file}: the file is empty (it needs a header row)`);
  const header = rows[0].cells.map((h) => h.toLowerCase());
  const missing = required.filter((c) => header.indexOf(c) < 0);
  if (missing.length) throw new Error(`${file}: missing column(s) ${missing.join(", ")} in the header row`);
  return rows.slice(1).map((r) => {
    const o = { __line: String(r.line) } as CsvRow;
    header.forEach((h, i) => { if (h) o[h] = r.cells[i] ?? ""; });
    return o;
  });
}

/** Splits a list cell such as "step one | step two". */
export const splitList = (s: string | undefined, sep: RegExp = /\|/) =>
  (s || "").split(sep).map((x) => x.trim()).filter(Boolean);
