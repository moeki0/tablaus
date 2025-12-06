/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef } from "react";
import { Row } from "./row";
import { useAtom } from "jotai";
import { Header } from "./header";
import { TableFooter } from "./TableFooter";
import { tableAtom } from "./dataAtom";
import {
  ensureRowLength,
  extractBody,
  extractColumns,
  extractFooter,
  parseCsv,
} from "./csvTable";
import type { RowValues } from "./row";
import { initialCsv as defaultCsv } from "./csvTable";
import { TableTitle } from "./TableTitle";

export function Table({
  tableId,
  initialCsv,
  initialName,
}: {
  tableId?: string;
  initialCsv?: string;
  initialName: string;
}) {
  const [csv, setCsv] = useAtom(tableAtom);
  const inputsRef = useRef<HTMLInputElement[][]>([]);
  const currentColRef = useRef<number>(null);
  const colsRef = useRef<(HTMLInputElement | null)[]>([]);
  const currentRowRef = useRef<number | null>(null);

  useEffect(() => {
    const next = initialCsv ?? defaultCsv;
    setCsv(next);
  }, [initialCsv, setCsv]);

  useEffect(() => {
    if (!tableId) return;
    const controller = new AbortController();
    const id = setTimeout(() => {
      fetch(`/api/tables/${tableId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
        signal: controller.signal,
      }).catch((err) => console.error(err));
    }, 500);
    return () => {
      controller.abort();
      clearTimeout(id);
    };
  }, [csv, tableId]);

  const columns = useMemo(() => {
    const table = parseCsv(csv);
    const cols = extractColumns(table);
    return cols;
  }, [csv]);
  const { bodyRows, footer } = useMemo(() => {
    const table = parseCsv(csv);
    const cols = extractColumns(table);
    const body = extractBody(table);
    const foot = extractFooter(table);
    return { columns: cols, bodyRows: body, footer: foot };
  }, [csv]);

  const bodyRowObjects: RowValues[] = useMemo(
    () =>
      bodyRows.map((row) =>
        columns.reduce<RowValues>((acc, col, idx) => {
          acc[col] = ensureRowLength(row, columns.length)[idx] ?? "";
          return acc;
        }, {})
      ),
    [bodyRows, columns]
  );

  return (
    <div className="p-4 flex justify-center">
      <div className="bg-white inline-block overflow-scroll p-8 shadow border border-gray-200 rounded">
        <TableTitle id={tableId!} initialName={initialName} />
        <table>
          <thead>
            <tr className="">
              {columns.map((c, i) => (
                <Header
                  colsRef={colsRef}
                  i={i}
                  c={c}
                  key={`c-${i}`}
                  currentRowRef={currentRowRef}
                  columns={columns}
                  currentColRef={currentColRef}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, i) => (
              <Row
                key={`row-${i}`}
                row={row}
                rowValues={bodyRowObjects[i]}
                i={i}
                inputsRef={inputsRef}
                currentRowRef={currentRowRef}
                colsRef={colsRef}
                columns={columns}
                allRows={bodyRows}
              />
            ))}
            <TableFooter
              columns={columns}
              footer={footer}
              bodyRows={bodyRows}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}
