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
    <tr className="sticky bottom-0 border-gray-200">
      {columns.map((c, i) => (
        <>
          {i !== 0 && (
            <FooterCell
              key={`c-${i}`}
              i={i}
              value={footer[i] ?? ""}
              columns={columns}
              bodyRows={bodyRows}
            />
          )}
        </>
      ))}
    </tr>
  );
}
