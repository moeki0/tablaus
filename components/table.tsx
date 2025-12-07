/* eslint-disable react-hooks/preserve-manual-memoization */
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
  stringifyCsv,
} from "./csvTable";
import type { RowValues } from "./row";
import { initialCsv as defaultCsv } from "./csvTable";
import { TableTitle } from "./TableTitle";
import { emitTableUpdated } from "@/lib/tableUpdateEvent";
import {
  FiFilter,
  FiSidebar,
  FiMoreHorizontal,
  FiDownload,
  FiCopy,
} from "react-icons/fi";
import { EvalContext, resolveProperty } from "./formula";
import { useRouter } from "next/navigation";
import {
  autoUpdate,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useListNavigation,
  useRole,
  offset,
  flip,
  shift,
  useMergeRefs,
} from "@floating-ui/react";
/* eslint-disable @typescript-eslint/no-explicit-any */

type ParsedFilter = {
  column: string;
  kind: "regex" | "text";
  value: string;
  flags?: string;
  not: boolean;
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
  const regex = /(-?)"([^"]+)"\s*:\s*(DESC|ASC|".*")/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(spec))) {
    const not = match[1];
    const column = match[2];
    const raw = match[3];
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
          not: not === "-",
          value: regexMatch[1],
          flags: regexMatch[2],
        });
        continue;
      }
    }

    const trimmed = raw.replace(/^["']|["']$/g, "");
    filters.push({ column, kind: "text", not: not === "-", value: trimmed });
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
  const router = useRouter();
  const csv = useAtomValue(tableAtom);
  const [querySpec, setQuerySpec] = useState(initialQuerySpec ?? "");
  const [menuOpen, setMenuOpen] = useState(false);
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
  const menuRef = useRef<HTMLDivElement | null>(null);

  const {
    refs: floatingRefs,
    floatingStyles,
    context: floatingContext,
  } = useFloating({
    placement: "bottom-end",
    open: menuOpen,
    onOpenChange: setMenuOpen,
    middleware: [offset(6), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });
  const click = useClick(floatingContext);
  const dismiss = useDismiss(floatingContext);
  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
  ]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const suggestListRef = useRef<Array<HTMLButtonElement | null>>([]);
  const {
    refs: suggestRefs,
    floatingStyles: suggestStyles,
    context: suggestContext,
  } = useFloating({
    placement: "bottom-start",
    open: suggestOpen,
    onOpenChange: setSuggestOpen,
    middleware: [offset(6), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });
  const suggestRole = useRole(suggestContext, { role: "listbox" });
  const suggestDismiss = useDismiss(suggestContext);
  const suggestListNav = useListNavigation(suggestContext, {
    listRef: suggestListRef,
    activeIndex,
    onNavigate: setActiveIndex,
    loop: true,
  });
  const {
    getReferenceProps: getSuggestRefProps,
    getFloatingProps: getSuggestFloatingProps,
    getItemProps,
  } = useInteractions([suggestRole, suggestDismiss, suggestListNav]);

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

  const queryInputRef = useRef<HTMLInputElement | null>(null);

  const parsedTable = useMemo(() => parseCsv(csv), [csv]);
  const columns = useMemo(() => extractColumns(parsedTable), [parsedTable]);
  const footer = useMemo(() => extractFooter(parsedTable), [parsedTable]);
  const rawBodyRows = useMemo(() => extractBody(parsedTable), [parsedTable]);

  const parsedQuery = useMemo(() => parseQuerySpec(querySpec), [querySpec]);

  const rowsForEval = useMemo(
    () =>
      rawBodyRows.map((r) =>
        columns.reduce<RowValues>((acc, col, idx) => {
          acc[col] = r[idx] ?? "";
          return acc;
        }, {})
      ),
    [columns, rawBodyRows]
  );

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
            return (row: (typeof rowsWithIndex)[number]) => {
              const ctx: EvalContext = {
                rows: rowsForEval.map((r) => ({ values: r })),
                columns,
                rowValues: rowsForEval[row.originalIndex],
                rowIndex: row.originalIndex,
                columnIndex,
              };
              const res = reg.test(
                String(resolveProperty(columns[columnIndex], ctx)) ?? ""
              );
              return f.not ? !res : res;
            };
          } catch {
            return null;
          }
        }
        const needle = f.value.toLowerCase();
        return (row: (typeof rowsWithIndex)[number]) => {
          const ctx: EvalContext = {
            rows: rowsForEval.map((r) => ({ values: r })),
            columns,
            rowValues: rowsForEval[row.originalIndex],
            rowIndex: row.originalIndex,
            columnIndex,
          };
          const res =
            String(resolveProperty(columns[columnIndex], ctx)) === needle;
          return f.not ? !res : res;
        };
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

  const mergedQueryRef = useMergeRefs([
    suggestRefs.setReference,
    queryInputRef,
  ]);

  const firstColumn = columns[0] ?? "";
  const suggestions = firstColumn
    ? [
        {
          query: `"${firstColumn}":DESC`,
          description: "Sort from largest to smallest",
        },
        {
          query: `"${firstColumn}":ASC`,
          description: "Sort from smallest to largest",
        },
        { query: `"${firstColumn}":""`, description: "Include" },
        { query: `-"${firstColumn}":""`, description: "Exclude" },
        {
          query: `"${firstColumn}":/regexp/`,
          description: "Regular Expression",
        },
      ]
    : [];
  useEffect(() => {
    if (!suggestOpen) {
      setTimeout(() => {
        queryInputRef.current?.focus();
      });
    }
  }, [suggestOpen]);

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

  const downloadFile = (content: BlobPart, type: string, filename: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    downloadFile(
      csv,
      "text/csv;charset=utf-8",
      `${initialName || "table"}.csv`
    );
    setMenuOpen(false);
  };

  const handleDuplicate = async () => {
    const header = columns.length ? columns : [];
    const firstRow = rawBodyRows.length
      ? ensureRowLength(rawBodyRows[0], columns.length)
      : ensureRowLength([], columns.length);
    const footerRow = footer.length
      ? ensureRowLength(footer, columns.length)
      : ensureRowLength([], columns.length);
    const duplicateCsv = stringifyCsv([header, firstRow, footerRow]);

    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${initialName} Copy`,
          csv: duplicateCsv,
          querySpec,
        }),
      });
      if (!res.ok) throw new Error("Failed to duplicate");
      const data = await res.json();
      setMenuOpen(false);
      router.push(`/tables/${data.id}`);
    } catch (err) {
      console.error(err);
    }
  };

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
        <div className="flex items-center gap-2 bg-gray-50 pl-2 rounded border border-gray-200 flex-1 max-w-[250px]">
          <FiFilter className="stroke-gray-500" size={14} />
          <input
            value={querySpec}
            onChange={(e) => {
              setQuerySpec(e.target.value);
              setSuggestOpen(!e.target.value.trim() && suggestions.length > 0);
            }}
            className="flex-1 bg-transparent px-1 py-1 text-sm outline-0"
            aria-label="Query"
            ref={mergedQueryRef}
            {...getSuggestRefProps({
              onFocus: () => {
                if (!querySpec.trim() && suggestions.length > 0) {
                  setSuggestOpen(true);
                }
              },
            })}
          />
        </div>
        {suggestOpen && suggestions.length ? (
          <div
            ref={suggestRefs.setFloating}
            style={suggestStyles}
            {...getSuggestFloatingProps()}
            className="z-30 mt-1 w-80 rounded border border-gray-200 bg-white shadow-lg overflow-hidden"
          >
            {suggestions.map((s, idx) => (
              <button
                key={s.query}
                ref={(node) => {
                  suggestListRef.current[idx] = node;
                }}
                {...getItemProps({
                  onClick: () => {
                    setQuerySpec(s.query);
                    setSuggestOpen(false);
                  },
                  onMouseEnter: () => setActiveIndex(idx),
                  onMouseLeave: () => setActiveIndex(null),
                })}
                className={`flex w-full items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-50 ${
                  activeIndex === idx ? "bg-gray-50" : ""
                }`}
              >
                <span className="truncate">{s.query}</span>
                <span className="text-gray-400 text-xs">{s.description}</span>
              </button>
            ))}
          </div>
        ) : null}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded p-2 hover:bg-gray-100 transition"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Menu"
            ref={floatingRefs.setReference}
            {...getReferenceProps()}
          >
            <FiMoreHorizontal size={18} />
          </button>
          {menuOpen ? (
            <div
              ref={floatingRefs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="z-20 mt-2 w-48 rounded border border-gray-200 bg-white shadow-lg overflow-hidden"
            >
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
              >
                <FiDownload />
                Download CSV
              </button>
              <button
                type="button"
                onClick={handleDuplicate}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
              >
                <FiCopy />
                Duplicate
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <div className="p-4 h-[calc(100vh-50px)] overflow-scroll max-w-full">
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
