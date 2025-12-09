/* eslint-disable react-hooks/refs */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFloating } from "@floating-ui/react";
import * as autosizeInput from "autosize-input";
import { evaluateFormulaContent, stringifyFormulaValue } from "./formula";
import { parseCsv, stringifyCsv, ensureRowLength } from "./csvTable";
import { commitDraftAtom, startDraftAtom, tableAtom } from "./dataAtom";
import { useAtom, useSetAtom } from "jotai";

export function FooterCell({
  i,
  value,
  columns,
  bodyRows,
}: {
  i: number;
  value: string;
  columns: string[];
  bodyRows: string[][];
}) {
  const [csv, setCsv] = useAtom(tableAtom);
  const startDraft = useSetAtom(startDraftAtom);
  const commitDraft = useSetAtom(commitDraftAtom);
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLTableCellElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { refs, floatingStyles } = useFloating({
    placement: "top-start",
  });
  const [completion, setCompletion] = useState(false);
  const [highlight, setHighlight] = useState<number | null>(null);
  const suggestions = useMemo(() => ["% count()", "% sum()"], []);

  const rowObjects = useMemo(
    () =>
      bodyRows.map((r) =>
        columns.reduce<Record<string, string>>((acc, col, idx) => {
          acc[col] = r[idx] ?? "";
          return acc;
        }, {})
      ),
    [bodyRows, columns]
  );

  const evaluation = useMemo(() => {
    if (!value) return null;
    return evaluateFormulaContent(value, {
      rows: rowObjects,
      columns,
      columnIndex: i,
      rowIndex: -1,
    });
  }, [columns, i, rowObjects, value]);

  const result = useMemo(() => {
    if (!value) return "";
    if (!evaluation || !evaluation.isFormula) return value;
    if (evaluation.error) return `#ERR ${evaluation.error}`;
    return stringifyFormulaValue(evaluation.value);
  }, [evaluation, value]);

  useEffect(() => {
    if (!inputRef.current) {
      return;
    }
    autosizeInput(inputRef.current);
  }, [editing, result]);

  if (i === 0) {
    return <></>;
  }

  const updateFooterValue = (newValue: string) => {
    setCsv((csv) => {
      const table = parseCsv(csv);
      const footerIndex = table.length - 1;
      table[footerIndex] = ensureRowLength(table[footerIndex], columns.length);
      table[footerIndex][i] = newValue;
      return stringifyCsv(table);
    });
  };

  return (
    <td ref={refs.setReference}>
      <input
        ref={inputRef}
        onBlur={() => {
          setEditing(false);
          commitDraft();
          setCompletion(false);
          setHighlight(null);
        }}
        onFocus={() => {
          setEditing(true);
          startDraft();
          const shouldComplete = !value;
          setCompletion(shouldComplete);
          setHighlight(shouldComplete ? 0 : null);
        }}
        className={`px-2 py-1 border-r border-gray-200 border-t ${
          editing ? "font-mono bg-white" : "bg-gray-100"
        } outline-0 min-w-full min-h-9`}
        value={editing ? value : result}
        onKeyDown={(e) => {
          if (completion && suggestions.length > 0 && e.key === "Tab") {
            e.preventDefault();
            setHighlight((prev) => {
              if (prev === null) return 0;
              const next = e.shiftKey
                ? (prev - 1 + suggestions.length) % suggestions.length
                : (prev + 1) % suggestions.length;
              return next;
            });
            return;
          }
          if (completion && highlight !== null && e.key === "Enter") {
            e.preventDefault();
            const chosen = suggestions[highlight];
            updateFooterValue(chosen);
            setCompletion(false);
            setHighlight(null);
            inputRef.current?.focus();
            return;
          }
          if (e.key === "Escape") {
            setCompletion(false);
            setHighlight(null);
          }
        }}
        onChange={(e) => {
          const newValue = e.target.value;
          const shouldComplete = newValue === "";
          setCompletion(shouldComplete);
          setHighlight(shouldComplete ? 0 : null);
          updateFooterValue(newValue);
        }}
      />
      {completion &&
        editing &&
        createPortal(
          <div ref={refs.setFloating} style={floatingStyles}>
            <div className=" text-white font-mono text-xs rounded overflow-hidden flex">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={`footer-c-${idx}`}
                  className={`px-3 cursor-pointer hover:bg-gray-700 z-50 py-0.5 ${
                    highlight === idx ? "bg-gray-700 underline" : "bg-gray-900"
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    updateFooterValue(suggestion);
                    setCompletion(false);
                    setHighlight(null);
                    inputRef.current?.focus();
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </td>
  );
}
