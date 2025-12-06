/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef } from "react";
import { Row } from "./row";
import { useAtomValue, useSetAtom } from "jotai";
import { Header } from "./header";
import { TableFooter } from "./TableFooter";
import {
  commitDraftAtom,
  redoAtom,
  resetTableAtom,
  startDraftAtom,
  tableAtom,
  undoAtom,
} from "./dataAtom";
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
import { emitTableUpdated } from "@/lib/tableUpdateEvent";

export function Table({
  tableId,
  initialCsv,
  initialName,
}: {
  tableId?: string;
  initialCsv?: string;
  initialName: string;
}) {
  const csv = useAtomValue(tableAtom);
  const resetTable = useSetAtom(resetTableAtom);
  const undo = useSetAtom(undoAtom);
  const redo = useSetAtom(redoAtom);
  const startDraft = useSetAtom(startDraftAtom);
  const commitDraft = useSetAtom(commitDraftAtom);
  const inputsRef = useRef<HTMLInputElement[][]>([]);
  const currentColRef = useRef<number>(null);
  const colsRef = useRef<(HTMLInputElement | null)[]>([]);
  const currentRowRef = useRef<number | null>(null);
  const initRef = useRef(csv);

  useEffect(() => {
    const next = initialCsv ?? defaultCsv;
    resetTable(next);
  }, [initialCsv, resetTable]);

  useEffect(() => {
    initRef.current = csv;
  }, [csv]);

  useEffect(() => {
    if (!tableId) return;
    if (initRef.current === csv) {
      return;
    }
    const controller = new AbortController();
    const id = setTimeout(() => {
      fetch(`/api/tables/${tableId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
        signal: controller.signal,
      })
        .then((res) => {
          if (!controller.signal.aborted && res?.ok) {
            emitTableUpdated(tableId);
          }
        })
        .catch((err) => console.error(err));
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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing) return;
      const key = e.key.toLowerCase();
      const withModifier = e.metaKey || e.ctrlKey;
      const isUndo = withModifier && key === "z" && !e.shiftKey;
      const isRedo =
        withModifier && (key === "y" || (key === "z" && e.shiftKey));
      if (!isUndo && !isRedo) return;

      const target = e.target as HTMLElement | null;
      const isInputElement =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (isInputElement) return;

      if (isUndo) {
        e.preventDefault();
        undo();
      } else if (isRedo) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [redo, undo]);

  return (
    <div className="">
      <div className="px-4 py-2 border-b border-gray-200">
        <TableTitle id={tableId!} initialName={initialName} />
      </div>
      <div className="p-4 h-[calc(100vh-80px)] overflow-scroll max-w-full">
        <table>
          <thead>
            <tr className="border border-gray-200 divide-gray-200 divide-x">
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
                onStartEdit={startDraft}
                onEndEdit={commitDraft}
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
