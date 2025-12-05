/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/refs */
"use client";

import { useAtom } from "jotai";
import { columnAtom, rowAtom } from "./atoms";
import { useFloating } from "@floating-ui/react";
import { createPortal } from "react-dom";
import { RefObject, useEffect, useMemo, useState } from "react";
import _ from "lodash";
import { addDays, format, isValid, parse } from "date-fns";
import * as autosizeInput from "autosize-input";

export function Cell({
  value,
  i,
  j,
  inputsRef,
  currentRowRef,
  colsRef,
}: {
  value: string;
  i: number;
  j: number;
  inputsRef: RefObject<(HTMLInputElement | null)[][]>;
  currentRowRef: RefObject<number | null>;
  colsRef: RefObject<(HTMLInputElement | null)[]>;
}) {
  const [rows, setRows] = useAtom(rowAtom);
  const [columns, setColumns] = useAtom(columnAtom);
  const { refs, floatingStyles } = useFloating({
    placement: "top-start",
  });
  const [completion, setCompletion] = useState(false);
  const values = _.uniq(rows.map((r) => r.values[j]).filter((r, k) => k !== i));
  const nextDate: string | null = useMemo(() => {
    const v = rows.map((r) => r.values[j])[i - 1];
    if (!v) {
      return null;
    }
    const parsed = parse(v, "yyyy/MM/dd", new Date());
    if (!isValid(parsed)) {
      return null;
    }
    return format(addDays(parsed, 1), "yyyy/MM/dd");
  }, [i, j, rows]);
  const allValues = useMemo(() => {
    let v = values.filter((v) => v);
    if (nextDate !== null) {
      v = [nextDate];
    }
    return v;
  }, [values, nextDate]);
  const [com, setCom] = useState<number | null>(null);

  const setCurrent = (value: string) => {
    setRows((rows) => {
      return rows.map((row, k) => {
        if (k === i) {
          row.values = row.values.map((c, l) => {
            if (l === j) {
              return value;
            }
            return c;
          });
        }
        return row;
      });
    });
    if (inputsRef.current[i][j]) {
      inputsRef.current[i][j].value = value || "";
      const e = new Event("input", { bubbles: true });
      inputsRef.current[i][j].dispatchEvent(e);
    }
  };

  useEffect(() => {
    if (j === 0 && currentRowRef.current === i) {
      inputsRef.current[i][j]?.focus();
    }
    autosizeInput(inputsRef.current[i][j]);
  }, [currentRowRef, i, inputsRef, j]);

  useEffect(() => {
    if (inputsRef.current[i][j] && value?.match(/\[[x ]\]/)) {
      inputsRef.current[i][j].style.fontFamily = "monospace";
      autosizeInput(inputsRef.current[i][j]);
    } else if (inputsRef.current[i][j]) {
      inputsRef.current[i][j].style.fontFamily = "Helvetica Neue";
      autosizeInput(inputsRef.current[i][j]);
    }
  }, [i, inputsRef, j, value]);

  return (
    <>
      <td ref={refs.setReference}>
        <input
          ref={(el) => {
            if (!inputsRef.current[i]) {
              inputsRef.current[i] = [];
            }
            inputsRef.current[i][j] = el;
          }}
          className="p-2 outline-0 min-w-full"
          value={value || ""}
          onFocus={() => {
            currentRowRef.current = i;
            if (inputsRef.current[i][j]?.value) {
              return;
            }
            if (allValues.length === 0) {
              return;
            }
            setCompletion(true);
            setCom(0);
          }}
          onBlur={() => {
            setCom(null);
            setCompletion(false);
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
              !rows[i].values.some((v) => v)
            ) {
              e.preventDefault();
              setRows((rows) => {
                return rows.filter((r, index) => index !== i);
              });
              if (inputsRef.current[i - 1]) {
                inputsRef.current[i - 1][
                  inputsRef.current[i - 1].length - 1
                ]?.focus();
              } else {
                colsRef.current[colsRef.current.length - 1]?.focus();
              }
              return;
            }
            if (e.key === "Tab" && e.shiftKey) {
              return;
            }
            if (e.key === "Tab") {
              e.preventDefault();
            }
            if (e.key === "Escape") {
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
              setRows((rows) => {
                if (currentRowRef.current === null) return rows;
                return [
                  ...rows.slice(0, currentRowRef.current + 1),
                  {
                    id: crypto.randomUUID().replace(/-/g, ""),
                    values: columns.map(() => ""),
                  },
                  ...rows.slice(currentRowRef.current + 1),
                ];
              });
              if (currentRowRef.current !== null) {
                currentRowRef.current += 1;
              }
            }
            if (com === null && e.key === "Tab" && !e.shiftKey) {
              setCompletion(false);
              setCom(null);
              if (j < rows[i].values.length - 1) {
                inputsRef.current[i][j + 1]?.focus();
              } else if (i === rows.length - 1) {
                setRows((rows) => [
                  ...rows,
                  {
                    id: crypto.randomUUID().replace(/-/g, ""),
                    values: columns.map(() => ""),
                  },
                ]);
                if (currentRowRef.current) {
                  currentRowRef.current += 1;
                }
              } else {
                inputsRef.current[i + 1][0]?.focus();
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
