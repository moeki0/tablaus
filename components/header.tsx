/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { RefObject, useEffect, useRef } from "react";
import * as autosizeInput from "autosize-input";
import {
  parseCsv,
  stringifyCsv,
  ensureRowLength,
  createEmptyRow,
} from "./csvTable";
import { useAtom } from "jotai";
import { tableAtom } from "./dataAtom";

export function Header({
  colsRef,
  i,
  c,
  currentRowRef,
  columns,
  currentColRef,
}: {
  colsRef: RefObject<(HTMLInputElement | null)[]>;
  i: number;
  c: string;
  currentRowRef: RefObject<number | null>;
  columns: string[];
  currentColRef: RefObject<number | null>;
}) {
  const [csv, setCsv] = useAtom(tableAtom);
  const prevColumns = useRef(columns);

  useEffect(() => {
    autosizeInput(colsRef.current[i]);
  }, [colsRef, i, c]);

  useEffect(() => {
    if (
      currentColRef.current === i &&
      prevColumns.current.join("") !== columns.join("")
    ) {
      colsRef.current[i]?.focus();
      prevColumns.current = columns;
    }
  }, [colsRef, currentColRef, i, c, columns]);

  return (
    <th className="">
      <input
        className="p-2 outline-0 min-w-full"
        ref={(el) => {
          colsRef.current[i] = el;
        }}
        onFocus={() => {
          currentRowRef.current = -1;
          currentColRef.current = i;
        }}
        value={c}
        onChange={(e) => {
          setCsv((csv) => {
            const table = parseCsv(csv);
            table[0] = ensureRowLength(table[0], columns.length);
            table[0][i] = e.target.value;
            return stringifyCsv(table);
          });
        }}
        onKeyDown={(e) => {
          if (
            (e as any).isComposing ||
            e.key === "Process" ||
            e.keyCode === 229
          ) {
            return;
          }
          const table = parseCsv(csv);
          if (
            (e.key === "Delete" || e.key === "Backspace") &&
            c.length === 0 &&
            !table.some((r) => r[i])
          ) {
            setCsv((csv) => {
              const table = parseCsv(csv);
              let rows =
                table.length > 0
                  ? table
                  : [createEmptyRow(table), createEmptyRow(table)];
              rows = rows.map((r) => r.filter((c, j) => j !== i));
              return stringifyCsv(rows);
            });
            if (colsRef.current) {
              colsRef.current[i - 1]?.focus();
            }
            e.preventDefault();
            return;
          }
          if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
            if (colsRef.current[i]?.selectionStart === 0) {
              setCsv((csv) => {
                const table = parseCsv(csv);
                let rows =
                  table.length > 0
                    ? table
                    : [createEmptyRow(table), createEmptyRow(table)];
                rows = rows.map((row) => {
                  return [...row.slice(0, i), "", ...row.slice(i)];
                });
                return stringifyCsv(rows);
              });
              currentColRef.current = i;
            } else {
              setCsv((csv) => {
                const table = parseCsv(csv);
                let rows =
                  table.length > 0
                    ? table
                    : [createEmptyRow(table), createEmptyRow(table)];
                rows = rows.map((row) => {
                  return [...row.slice(0, i + 1), "", ...row.slice(i + 1)];
                });
                return stringifyCsv(rows);
              });
              currentColRef.current = i + 1;
            }
          }
        }}
      />
    </th>
  );
}
