const escapeCell = (cell: string) => {
  const needsQuote = /[",\n]/.test(cell);
  const escaped = cell.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
};

export const initialCsv = [
  ["id", "Col1", "Col2"],
  [crypto.randomUUID(), "A", "B"],
  ["", "", ""],
]
  .map((row) => row.map(escapeCell).join(","))
  .join("\n");
export const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  const flushCell = () => {
    row.push(current);
    current = "";
  };

  const flushRow = () => {
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"';
        i++;
        continue;
      }
      if (char === '"') {
        inQuotes = false;
        continue;
      }
      current += char;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      flushCell();
      continue;
    }
    if (char === "\n") {
      flushCell();
      flushRow();
      continue;
    }
    current += char;
  }
  flushCell();
  flushRow();
  return rows;
};

export const stringifyCsv = (rows: string[][]): string => {
  const normalizeCell = (cell: string | undefined): string => {
    const value = cell ?? "";
    const needsQuote = /[",\n]/.test(value);
    const escaped = String(value).replace(/"/g, '""');
    return needsQuote ? `"${escaped}"` : value;
  };
  return rows
    .map((row) => row.map((cell) => normalizeCell(cell)).join(","))
    .join("\n");
};

export const ensureRowLength = (
  row: string[] | undefined,
  len: number
): string[] => {
  const copy = [...(row ?? [])];
  while (copy.length < len) {
    copy.push("");
  }
  return copy;
};

export const createEmptyRow = (table: string[][]): string[] => {
  const template =
    table[1] ?? (table[0] ? ensureRowLength([], table[0].length) : []);
  return template.map((c, i) =>
    i === 0 ? crypto.randomUUID() : c.match(/^% /) ? c : ""
  );
};

export const extractColumns = (table: string[][]): string[] =>
  ensureRowLength(table[0], table[0]?.length ?? 0);

export const extractFooter = (table: string[][]): string[] =>
  table.length > 1
    ? ensureRowLength(table[table.length - 1], table[0]?.length ?? 0)
    : [];

export const extractBody = (table: string[][]): string[][] => {
  if (table.length <= 1) return [];
  return table
    .slice(1, table.length - 1)
    .map((r) => ensureRowLength(r, table[0]?.length ?? 0));
};
