"use client";

import { FooterCell } from "./FooterCell";

export function TableFooter({
  columns,
  footer,
  bodyRows,
}: {
  columns: string[];
  footer: string[];
  bodyRows: string[][];
}) {
  return (
    <tr className=" divide-gray-200 divide-x border-y border-gray-200">
      {columns.map((c, i) => (
        <FooterCell
          key={`c-${i}`}
          i={i}
          value={footer[i] ?? ""}
          columns={columns}
          bodyRows={bodyRows}
        />
      ))}
    </tr>
  );
}
