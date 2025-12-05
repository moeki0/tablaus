/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRef } from "react";
import { Row } from "./row";
import { useAtom } from "jotai";
import { columnAtom, rowAtom } from "./atoms";
import { Header } from "./header";

export type Column = string;

export type Row = string[];

export function Table() {
  const [columns] = useAtom(columnAtom);
  const [rows, setRows] = useAtom(rowAtom);
  const inputsRef = useRef<HTMLInputElement[][]>([]);
  const colsRef = useRef<(HTMLInputElement | null)[]>([]);
  const currentRowRef = useRef<number | null>(null);

  return (
    <div className="p-4 flex justify-center">
      <div className="bg-white inline-block overflow-scroll p-8 shadow border border-gray-200 my-[100px] rounded">
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
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <Row
                key={row.id}
                row={row.values}
                i={i}
                inputsRef={inputsRef}
                currentRowRef={currentRowRef}
                colsRef={colsRef}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
