/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useAtom } from "jotai";
import { columnAtom, footerAtom, rowAtom } from "./atoms";
import { RefObject, useEffect } from "react";
import { Column } from "./table";
import * as autosizeInput from "autosize-input";

export function Header({
  colsRef,
  i,
  c,
  currentRowRef,
}: {
  colsRef: RefObject<(HTMLInputElement | null)[]>;
  i: number;
  c: Column;
  currentRowRef: RefObject<number | null>;
}) {
  const [, setColumns] = useAtom(columnAtom);
  const [, setRows] = useAtom(rowAtom);
  const [, setFooters] = useAtom(footerAtom);

  useEffect(() => {
    colsRef.current[i]?.focus();
    autosizeInput(colsRef.current[i]);
  }, [colsRef, i]);

  return (
    <th className="">
      <input
        className="p-2 outline-0 min-w-full"
        ref={(el) => {
          colsRef.current[i] = el;
        }}
        onFocus={() => {
          currentRowRef.current = -1;
        }}
        value={c}
        onChange={(e) => {
          setColumns((column) => {
            return column.map((c, j) => {
              if (i === j) {
                return e.target.value;
              }
              return c;
            });
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
          if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
            setColumns((columns) => [...columns, ""]);
            setRows((rows) => {
              return rows.map((r) => {
                r.values = [...r.values, ""];
                return r;
              });
            });
            setFooters((footers) => {
              return [...footers, ""];
            });
          }
        }}
      />
    </th>
  );
}
