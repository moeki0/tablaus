"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

  return (
    <td>
      <input
        ref={inputRef}
        onBlur={() => {
          setEditing(false);
          commitDraft();
        }}
        onFocus={() => {
          setEditing(true);
          startDraft();
        }}
        className={`p-2 text-[14px] ${
          editing ? "font-mono bg-white" : "bg-gray-100"
        } outline-0 min-w-full min-h-9`}
        value={editing ? value : result}
        onChange={(e) => {
          setCsv((csv) => {
            const table = parseCsv(csv);
            const footerIndex = table.length - 1;
            table[footerIndex] = ensureRowLength(
              table[footerIndex],
              columns.length
            );
            table[footerIndex][i] = e.target.value;
            return stringifyCsv(table);
          });
        }}
      />
    </td>
  );
}
