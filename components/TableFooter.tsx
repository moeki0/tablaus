"use client";

import { FooterCell } from "./FooterCell";

export function TableFooter({
  columns,
  footer,
  bodyRows,
  tableLookup,
}: {
  columns: string[];
  footer: string[];
  bodyRows: string[][];
  tableLookup?: (id: string) => Promise<
    | {
        id: string;
        name: string;
        columns: string[];
        rows: Record<string, string>[];
        footer: string[];
      }
    | null
    | undefined
  >;
}) {
  return (
    <tr className=" divide-gray-200 divide-x border border-gray-200">
      {columns.map((c, i) => (
        <FooterCell
          key={`c-${i}`}
          i={i}
          value={footer[i] ?? ""}
          columns={columns}
          bodyRows={bodyRows}
          tableLookup={tableLookup}
        />
      ))}
    </tr>
  );
}
