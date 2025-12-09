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
  rowIndex,
  inputsRef,
  currentRowRef,
  colsRef,
  columns,
  allRows,
  onStartEdit,
  onEndEdit,
  tableLookup,
}: {
  row: string[];
  rowValues: RowValues;
  i: number;
  rowIndex: number;
  inputsRef: RefObject<HTMLInputElement[][]>;
  currentRowRef: RefObject<number | null>;
  colsRef: RefObject<(HTMLInputElement | null)[]>;
  columns: string[];
  allRows: string[][];
  onStartEdit?: () => void;
  onEndEdit?: () => void;
  tableLookup?: (id: string) => Promise<string[][] | null | undefined>;
}) {
  return (
    <tr className="border-t hover:bg-gray-50 border-gray-200" id={row[0]}>
      {columns.map((c, j) => (
        <Cell
          inputsRef={inputsRef}
          key={`cell-${j}`}
          value={row[j] ?? ""}
          j={j}
          i={i}
          rowIndex={rowIndex}
          currentRowRef={currentRowRef}
          colsRef={colsRef}
          columns={columns}
          rows={allRows}
          rowValues={rowValues}
          onStartEdit={onStartEdit}
          onEndEdit={onEndEdit}
          tableLookup={tableLookup}
        />
      ))}
    </tr>
  );
}
