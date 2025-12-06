"use client";

import { RefObject } from "react";
import { Cell } from "./cell";
import { useAtom } from "jotai";
import { tableAtom } from "./dataAtom";

export type RowValues = Record<string, string>;

export function Row({
  row,
  rowValues,
  i,
  inputsRef,
  currentRowRef,
  colsRef,
  columns,
  allRows,
}: {
  row: string[];
  rowValues: RowValues;
  i: number;
  inputsRef: RefObject<HTMLInputElement[][]>;
  currentRowRef: RefObject<number | null>;
  colsRef: RefObject<(HTMLInputElement | null)[]>;
  columns: string[];
  allRows: string[][];
}) {
  return (
    <tr className=" divide-gray-200 divide-x border-y border-gray-200">
      {columns.map((c, j) => (
        <Cell
          inputsRef={inputsRef}
          key={`cell-${j}`}
          value={row[j] ?? ""}
          j={j}
          i={i}
          currentRowRef={currentRowRef}
          colsRef={colsRef}
          columns={columns}
          rows={allRows}
          rowValues={rowValues}
        />
      ))}
    </tr>
  );
}
