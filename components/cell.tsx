/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/refs */
"use client";

import { useFloating } from "@floating-ui/react";
import { createPortal } from "react-dom";
import { RefObject, useEffect, useMemo, useState } from "react";
import _ from "lodash";
import { addDays, format, isValid, parse } from "date-fns";
import * as autosizeInput from "autosize-input";
import { evaluateFormulaContent, stringifyFormulaValue } from "./formula";
import {
  createEmptyRow,
  ensureRowLength,
  parseCsv,
  stringifyCsv,
  extractColumns,
  extractBody,
  extractFooter,
} from "./csvTable";
import type { RowValues } from "./row";
import { useAtom } from "jotai";
import { tableAtom } from "./dataAtom";
import { dateFormats, dateTimeFormats, timeFormats } from "./date-formats";

const parseDateValue = (
  value: string
): { date: Date; output: string } | null => {
  const trimmed = value.trim();
  for (const { pattern, output, matcher } of [
    ...dateTimeFormats,
    ...dateFormats,
    ...timeFormats,
  ]) {
    if (matcher && !matcher.test(trimmed)) {
      continue;
    }
    const parsed = parse(trimmed, pattern, new Date());
    if (isValid(parsed)) {
      return { date: parsed, output };
    }
  }
  const autoParsed = new Date(trimmed);
  if (isValid(autoParsed)) {
    const fallbackFormat = trimmed.includes("-")
      ? "yyyy-MM-dd"
      : trimmed.includes(".")
      ? "yyyy.MM.dd"
      : trimmed.includes("年")
      ? "yyyy年M月d日"
      : "yyyy/MM/dd";
    return { date: autoParsed, output: fallbackFormat };
  }
  return null;
};

export function Cell({
  value,
  i,
  j,
  rowIndex,
  inputsRef,
  currentRowRef,
  colsRef,
  columns,
  rows,
  rowValues,
  onStartEdit,
  onEndEdit,
}: {
  value: string;
  i: number;
  j: number;
  rowIndex: number;
  inputsRef: RefObject<(HTMLInputElement | null)[][]>;
  currentRowRef: RefObject<number | null>;
  colsRef: RefObject<(HTMLInputElement | null)[]>;
  columns: string[];
  rows: string[][];
  rowValues: RowValues;
  onStartEdit?: () => void;
  onEndEdit?: () => void;
}) {
  const [csv, setCsv] = useAtom(tableAtom);
  const { refs, floatingStyles } = useFloating({
    placement: "top-start",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [completion, setCompletion] = useState(false);
  const columnName = columns[j];
  const values = _.uniq(rows.map((r) => r[j]).filter((r, k) => k !== i));
  const nextDate: string | null = useMemo(() => {
    const v = rows[i - 1]?.[j];
    if (!v) {
      return null;
    }
    const parsed = parseDateValue(v);
    if (!parsed) {
      return null;
    }
    return format(addDays(parsed.date, 1), parsed.output);
  }, [i, j, rows]);
  const allValues = useMemo(() => {
    let v = values.filter((v) => v);
    if (nextDate !== null) {
      v = [nextDate];
    }
    return v;
  }, [values, nextDate]);
  const [com, setCom] = useState<number | null>(null);

  const rowsForEval = useMemo(
    () =>
      rows.map((r) =>
        columns.reduce<RowValues>((acc, col, idx) => {
          acc[col] = r[idx] ?? "";
          return acc;
        }, {})
      ),
    [columns, rows]
  );

  const evaluation = useMemo(
    () =>
      evaluateFormulaContent(value ?? "", {
        rows: rowsForEval.map((r) => ({ values: r })),
        columns,
        rowValues,
        rowIndex: i,
        columnIndex: j,
      }),
    [columns, i, j, rowValues, rowsForEval, value]
  );
  const buttonAction =
    evaluation.isFormula &&
    evaluation.value &&
    typeof evaluation.value === "object" &&
    (evaluation.value as any).__button
      ? (evaluation.value as {
          label: string;
          onClick: (rows: Record<string, string>[], rowIndex: number) => void;
        })
      : null;
  const displayValue = useMemo(() => {
    if (buttonAction && isEditing) return value || "";
    if (buttonAction && !isEditing) return "";
    if (isEditing) return value || "";
    if (!evaluation.isFormula) return value || "";
    if (evaluation.error) return `#ERR ${evaluation.error}`;
    return stringifyFormulaValue(evaluation.value);
  }, [buttonAction, evaluation, isEditing, value]);

  const setCurrent = (newValue: string) => {
    setCsv((csv) => {
      const table = parseCsv(csv);
      const targetIndex = rowIndex + 1; // header is 0
      table[targetIndex] = ensureRowLength(table[targetIndex], columns.length);
      table[targetIndex][j] = newValue;
      if (newValue.match(/^% /)) {
        table.forEach((row, k) => {
          if (k === 0 || k === table.length - 1) {
            return;
          }
          row[j] = newValue;
        });
      }
      return stringifyCsv(table);
    });
    if (inputsRef.current[i]?.[j]) {
      inputsRef.current[i][j]!.value = newValue || "";
      const e = new Event("input", { bubbles: true });
      inputsRef.current[i][j]!.dispatchEvent(e);
    }
  };

  useEffect(() => {
    if (j === 0 && currentRowRef.current === i) {
      inputsRef.current[i]?.[j]?.focus();
    }
  }, [currentRowRef, i, inputsRef, j]);

  useEffect(() => {
    if (inputsRef.current[i]?.[j]) {
      inputsRef.current[i][j].value ||= " ";
      autosizeInput(inputsRef.current[i]?.[j]);
    }
  }, [i, inputsRef, j, displayValue]);

  useEffect(() => {
    if (inputsRef.current[i]?.[j]) {
      inputsRef.current[i]![j]!.classList.add(
        value?.match(/\[[x ]\]/) || value?.match(/^% /)
          ? "font-mono"
          : "font-sans"
      );
      autosizeInput(inputsRef.current[i]![j]);
    }
  }, [i, inputsRef, j, value]);

  return (
    <>
      <td
        ref={refs.setReference}
        onClick={() => {
          setIsEditing(true);
        }}
      >
        {
          <input
            ref={(el) => {
              if (!inputsRef.current[i]) {
                inputsRef.current[i] = [];
              }
              inputsRef.current[i][j] = el;
            }}
            className={`p-2 text-[16px] ${
              !isEditing && !displayValue.match(/\[[x ]\]/) && "font-sans!"
            } outline-0 min-w-full ${
              !(!buttonAction || isEditing) && "hidden"
            } ${displayValue.match(/\[(x|\s)\]/) ? "font-mono!" : ""}`}
            value={displayValue}
            onFocus={() => {
              onStartEdit?.();
              setIsEditing(true);
              currentRowRef.current = i;
              if (inputsRef.current[i]?.[j]?.value) {
                return;
              }
              if (allValues.length === 0) {
                return;
              }
              setCompletion(true);
              setCom(0);
            }}
            onBlur={() => {
              onEndEdit?.();
              setCom(null);
              setCompletion(false);
              setIsEditing(false);
              currentRowRef.current = null;
            }}
            onPasteCapture={(e) => {
              const v = e.clipboardData.getData("text/plain");
              if (v.includes("\n")) {
                e.preventDefault();
                setCsv((csv) => {
                  const table = parseCsv(csv);
                  let rows = table;
                  rows = rows.map((r, a) => {
                    if (
                      a >= i + 1 &&
                      a <= i + 1 + v.split("\n").length &&
                      a < rows.length - 1
                    ) {
                      r[j] = v.split("\n")[a - i - 1];
                    }
                    return r;
                  });
                  const rest = rows.length - 1 - i - 1;
                  Array.from(
                    {
                      length: i + 1 + v.split("\n").length - rows.length + 1,
                    },
                    (_, index) => index
                  ).forEach((index) => {
                    rows = [
                      ...rows.slice(0, rows.length - 1),
                      createEmptyRow(table).map((c, k) => {
                        if (k === j) {
                          return v.split("\n")[index + rest];
                        }
                        return c;
                      }),
                      rows[rows.length - 1],
                    ];
                  });
                  return stringifyCsv(rows);
                });
                onStartEdit?.();
              }
            }}
            onKeyDown={(e) => {
              if (
                (e as any).isComposing ||
                e.key === "Process" ||
                e.keyCode === 229
              ) {
                return;
              }
              if (
                (e.key === "Delete" || e.key === "Backspace") &&
                j === 0 &&
                columns.every((col) => !rowValues[col])
              ) {
                e.preventDefault();
                if (csv.length === 3) {
                  return;
                }
                setCsv((csv) => {
                  const table = parseCsv(csv);
                  const targetIndex = i + 1;
                  table.splice(targetIndex, 1);
                  return stringifyCsv(table);
                });
                if (inputsRef.current[i - 1]) {
                  inputsRef.current[i - 1][columns.length - 1]?.focus();
                }
                return;
              }
              if (e.key === "Tab" && e.shiftKey) {
                return;
              }
              if (e.key === "Tab") {
                e.preventDefault();
              }
              if (
                e.key === "Escape" ||
                e.key === "Backspace" ||
                e.key === "Delete"
              ) {
                setCompletion(false);
                setCom(null);
                return;
              }
              if (e.key === "Enter" && com !== null) {
                setCurrent(allValues[com]);
                setCompletion(false);
                setCom(null);
                return;
              }
              if (e.key === "Enter" && com === null) {
                if (j === 0) {
                  setCsv((csv) => {
                    const table = parseCsv(csv);
                    const newRow = createEmptyRow(table);
                    table.splice(i + 1, 0, newRow); // after current body row (header + body)
                    return stringifyCsv(table);
                  });
                  inputsRef.current[i]?.[0]?.focus();
                } else {
                  setCsv((csv) => {
                    const table = parseCsv(csv);
                    const newRow = createEmptyRow(table);
                    table.splice(i + 2, 0, newRow); // after current body row (header + body)
                    return stringifyCsv(table);
                  });
                  if (i < columns.length - 1) {
                    inputsRef.current[i + 1]?.[0]?.focus();
                  }
                  if (currentRowRef.current !== null) {
                    currentRowRef.current += 1;
                  }
                }
              }
              if (com === null && e.key === "Tab" && !e.shiftKey) {
                setCompletion(false);
                setCom(null);
                console.log(i, j, rows.length, columns.length);
                if (i <= rows.length - 1 && j < columns.length - 1) {
                  inputsRef.current[i]?.[j + 1]?.focus();
                } else if (i < rows.length - 1) {
                  inputsRef.current[i + 1]?.[0]?.focus();
                } else {
                  setCsv((csv) => {
                    const table = parseCsv(csv);
                    const newRow = createEmptyRow(table);
                    table.splice(table.length - 1, 0, newRow);
                    return stringifyCsv(table);
                  });
                  if (currentRowRef.current !== null) {
                    currentRowRef.current += 1;
                  }
                }
                return;
              }
              if (e.key === "Tab") {
                if (com === null) {
                  setCom(0);
                  return;
                }
                setCom((com + 1) % allValues.length);
              }
            }}
            onChange={(e) => {
              if (e.target.value === "") {
                setCompletion(true);
                setCom(0);
              } else {
                setCompletion(false);
                setCom(null);
              }
              setCurrent(e.target.value);
            }}
          />
        }
        {buttonAction && !isEditing && (
          <button
            className="m-2 px-4 text-sm hover:bg-gray-50 transition py-[3px] rounded-lg cursor-pointer  bg-white border border-gray-200 shadow"
            onClick={(e) => {
              e.stopPropagation();
              setCsv((csv) => {
                const table = parseCsv(csv);
                const cols = extractColumns(table);
                const body = extractBody(table);
                const footer = extractFooter(table);
                const rowObjects = body.map((r) =>
                  cols.reduce<RowValues>((acc, col, idx) => {
                    acc[col] = r[idx] ?? "";
                    return acc;
                  }, {})
                );
                try {
                  buttonAction.onClick(rowObjects, i);
                } catch (error) {
                  console.error(error);
                  return csv;
                }
                const updatedBody = rowObjects.map((r) =>
                  cols.map((col) => r[col] ?? "")
                );
                const newTable = [
                  ensureRowLength(cols, cols.length),
                  ...updatedBody,
                  ensureRowLength(footer, cols.length),
                ];
                return stringifyCsv(newTable);
              });
            }}
          >
            {buttonAction.label}
          </button>
        )}
      </td>
      {completion && (
        <>
          {createPortal(
            <div ref={refs.setFloating} style={floatingStyles}>
              <div className=" text-white text-xs rounded overflow-hidden flex">
                {allValues.map((r, k) => (
                  <button
                    className={`px-3 cursor-pointer hover:bg-gray-700 z-50 py-1 ${
                      com === k ? "bg-gray-700 underline" : "bg-gray-900"
                    }`}
                    key={`c-${k}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setCurrent(r);
                      setCompletion(false);
                      setCom(null);
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>,
            document.body
          )}
        </>
      )}
    </>
  );
}
