/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { FiFilter, FiSidebar } from "react-icons/fi";
/* eslint-disable @typescript-eslint/no-explicit-any */

type ParsedFilter = {
  column: string;
  kind: "regex" | "text";
  value: string;
  flags?: string;
};

type ParsedSort = {
  column: string;
  direction: "asc" | "desc";
};

function parseQuerySpec(spec: string): {
  filters: ParsedFilter[];
  sorts: ParsedSort[];
} {
  const filters: ParsedFilter[] = [];
  const sorts: ParsedSort[] = [];
  const regex = /"([^"]+)"\s*:\s*([^\s]+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(spec))) {
    const column = match[1];
    const raw = match[2];
    const upper = raw.toUpperCase();

    if (upper === "ASC" || upper === "DESC") {
      sorts.push({ column, direction: upper === "ASC" ? "asc" : "desc" });
      continue;
    }

    if (raw.startsWith("/")) {
      const regexMatch = raw.match(/^\/(.+)\/([gimuy]*)$/);
      if (regexMatch) {
        filters.push({
          column,
          kind: "regex",
          value: regexMatch[1],
          flags: regexMatch[2],
        });
        continue;
      }
    }

    const trimmed = raw.replace(/^["']|["']$/g, "");
    filters.push({ column, kind: "text", value: trimmed });
  }

  return { filters, sorts };
}

export function Table({
  tableId,
  initialCsv,
  initialName,
  initialQuerySpec,
  onOpenSidebar,
}: {
  tableId?: string;
  initialCsv?: string;
  initialName: string;
  initialQuerySpec?: string;
  onOpenSidebar?: () => void;
}) {
  const csv = useAtomValue(tableAtom);
  const [querySpec, setQuerySpec] = useState(initialQuerySpec ?? "");
  const resetTable = useSetAtom(resetTableAtom);
  const undo = useSetAtom(undoAtom);
  const redo = useSetAtom(redoAtom);
  const startDraft = useSetAtom(startDraftAtom);
  const commitDraft = useSetAtom(commitDraftAtom);
  const inputsRef = useRef<HTMLInputElement[][]>([]);
  const currentColRef = useRef<number>(null);
  const colsRef = useRef<(HTMLInputElement | null)[]>([]);
  const currentRowRef = useRef<number | null>(null);
  const savedRef = useRef({ csv, querySpec: initialQuerySpec ?? "" });

  useEffect(() => {
    const next = initialCsv ?? defaultCsv;
    resetTable(next);
    setQuerySpec(initialQuerySpec ?? "");
    savedRef.current = { csv: next, querySpec: initialQuerySpec ?? "" };
  }, [initialCsv, initialQuerySpec, resetTable]);

  useEffect(() => {
    if (!tableId) return;
    const shouldSave =
      savedRef.current.csv !== csv || savedRef.current.querySpec !== querySpec;
    if (!shouldSave) return;

    const controller = new AbortController();
    const id = setTimeout(() => {
      fetch(`/api/tables/${tableId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, querySpec }),
        signal: controller.signal,
      })
        .then((res) => {
          if (!controller.signal.aborted && res?.ok) {
            savedRef.current = { csv, querySpec };
            emitTableUpdated(tableId);
          }
        })
        .catch((err) => console.error(err));
    }, 500);
    return () => {
      controller.abort();
      clearTimeout(id);
    };
  }, [csv, querySpec, tableId]);

  const parsedTable = useMemo(() => parseCsv(csv), [csv]);
  const columns = useMemo(() => extractColumns(parsedTable), [parsedTable]);
  const footer = useMemo(() => extractFooter(parsedTable), [parsedTable]);
  const rawBodyRows = useMemo(() => extractBody(parsedTable), [parsedTable]);

  const parsedQuery = useMemo(() => parseQuerySpec(querySpec), [querySpec]);

  const visibleRows = useMemo(() => {
    const rowsWithIndex = rawBodyRows.map((row, idx) => ({
      row: ensureRowLength(row, columns.length),
      originalIndex: idx,
    }));

    const filters = parsedQuery.filters
      .map((f) => {
        const columnIndex = columns.indexOf(f.column);
        if (columnIndex < 0) return null;
        if (f.kind === "regex") {
          try {
            const reg = new RegExp(f.value, f.flags);
            return (row: (typeof rowsWithIndex)[number]) =>
              reg.test(row.row[columnIndex] ?? "");
          } catch {
            return null;
          }
        }
        const needle = f.value.toLowerCase();
        return (row: (typeof rowsWithIndex)[number]) =>
          (row.row[columnIndex] ?? "").toLowerCase().includes(needle);
      })
      .filter(Boolean) as ((row: {
      row: string[];
      originalIndex: number;
    }) => boolean)[];

    const sorts = parsedQuery.sorts
      .map((s) => {
        const columnIndex = columns.indexOf(s.column);
        if (columnIndex < 0) return null;
        const dir = s.direction === "desc" ? -1 : 1;
        return (
          a: { row: string[]; originalIndex: number },
          b: { row: string[]; originalIndex: number }
        ) => {
          const av = a.row[columnIndex] ?? "";
          const bv = b.row[columnIndex] ?? "";
          const cmp = av.localeCompare(bv, undefined, {
            numeric: true,
            sensitivity: "base",
          });
          if (cmp !== 0) return cmp * dir;
          return 0;
        };
      })
      .filter(Boolean) as ((
      a: { row: string[]; originalIndex: number },
      b: { row: string[]; originalIndex: number }
    ) => number)[];

    const filtered = filters.length
      ? rowsWithIndex.filter((r) => filters.every((fn) => fn(r)))
      : rowsWithIndex;

    const sorted = sorts.reduce((acc, sorter) => {
      return [...acc].sort((a, b) => {
        const res = sorter(a, b);
        if (res !== 0) return res;
        return a.originalIndex - b.originalIndex;
      });
    }, filtered);

    return sorted;
  }, [columns, parsedQuery, rawBodyRows]);

  const visibleBodyRows = useMemo(
    () => visibleRows.map((v) => v.row),
    [visibleRows]
  );

  const bodyRowObjects: RowValues[] = useMemo(
    () =>
      visibleRows.map(({ row }) =>
        columns.reduce<RowValues>((acc, col, idx) => {
          acc[col] = row[idx] ?? "";
          return acc;
        }, {})
      ),
    [columns, visibleRows]
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
      <div className="flex flex-wrap items-center gap-2 p-2 md:px-4 border-b border-gray-200">
        {onOpenSidebar ? (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="md:hidden inline-flex items-center gap-2 rounded p-2 hover:bg-gray-100 transition"
          >
            <FiSidebar size={18} />
          </button>
        ) : null}
        <TableTitle id={tableId!} initialName={initialName} />
      </div>
      <div className="p-4 h-[calc(100vh-80px)] overflow-scroll max-w-full">
        <div className="flex items-center mb-4 text-gray-600 rounded bg-gray-50 pl-2 border border-gray-200 max-w-[250px]">
          <FiFilter className="stroke-gray-500" size={12} />
          <input
            value={querySpec}
            onChange={(e) => setQuerySpec(e.target.value)}
            className="w-full max-w-[250px] flex-1 ml-2 py-1 text-sm  outline-0"
            placeholder={`"Col1":DESC "Col1":"foo" "Col2":/^test-/`}
            aria-label="並び替え・フィルタ指定"
          />
        </div>
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
            {visibleRows.map(({ row, originalIndex }, i) => (
              <Row
                key={`row-${i}`}
                row={row}
                rowValues={bodyRowObjects[i]}
                i={i}
                rowIndex={originalIndex}
                inputsRef={inputsRef}
                currentRowRef={currentRowRef}
                colsRef={colsRef}
                columns={columns}
                allRows={visibleBodyRows}
                onStartEdit={startDraft}
                onEndEdit={commitDraft}
              />
            ))}
            <TableFooter
              columns={columns}
              footer={footer}
              bodyRows={visibleBodyRows}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}
