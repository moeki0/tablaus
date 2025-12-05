"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as autosizeInput from "autosize-input";
import { useAtom } from "jotai";
import { footerAtom, rowAtom } from "./atoms";
import _ from "lodash";

export function FooterCell({ i }: { i: number }) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLTableCellElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useAtom(rowAtom);
  const [footers, setFooters] = useAtom(footerAtom);
  const result = useMemo(() => {
    if (!footers[i]) {
      return;
    }
    const count =
      footers[i].match(/count\("(.+)"\)/) ||
      footers[i].match(/count\('(.+)'\)/);
    if (count) {
      return rows.map((r) => r.values[i]).filter((v) => v === count[1]).length;
    }
    const sum = footers[i].match(/sum\(\)/);
    if (sum) {
      return _.sum(rows.map((r) => Number(r.values[i])));
    }
    return "";
  }, [footers, i, rows]);

  useEffect(() => {
    if (!inputRef.current) {
      return;
    }
    autosizeInput(inputRef.current);
  }, [editing]);

  return (
    <td>
      {editing ? (
        <input
          ref={inputRef}
          onBlur={() => setEditing(false)}
          autoFocus
          className="p-2 bg-white font-mono outline-0 min-w-full"
          value={footers[i]}
          onChange={(e) => {
            setFooters((fs) => {
              return fs.map((f, j) => {
                if (j === i) {
                  return e.target.value;
                }
                return f;
              });
            });
          }}
        />
      ) : (
        <div
          ref={ref}
          onClick={() => setEditing(true)}
          className="p-2 min-w-full min-h-10 bg-gray-50"
        >
          {result}
        </div>
      )}
    </td>
  );
}
