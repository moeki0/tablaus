"use client";

import { RefObject } from "react";
import { Cell } from "./cell";
import type { Row } from "./table";

export function Row({
  row,
  i,
  inputsRef,
  currentRowRef,
  colsRef,
}: {
  row: Row;
  i: number;
  inputsRef: RefObject<HTMLInputElement[][]>;
  currentRowRef: RefObject<number | null>;
  colsRef: RefObject<(HTMLInputElement | null)[]>;
}) {
  return (
    <tr className=" divide-gray-200 divide-x border-y border-gray-200">
      {row.map((c, j) => (
        <Cell
          inputsRef={inputsRef}
          key={`cell-${j}`}
          value={c}
          j={j}
          i={i}
          currentRowRef={currentRowRef}
          colsRef={colsRef}
        />
      ))}
    </tr>
  );
}
