"use client";

import { useAtom } from "jotai";
import { FooterCell } from "./FooterCell";
import { columnAtom } from "./atoms";

export function TableFooter() {
  const [columns, setColumns] = useAtom(columnAtom);

  return (
    <tr className=" divide-gray-200 divide-x border-y border-gray-200">
      {columns.map((c, i) => (
        <FooterCell key={`c-${i}`} i={i} />
      ))}
    </tr>
  );
}
