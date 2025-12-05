"use client";

import { atom } from "jotai";

export const rowAtom = atom([
  {
    id: crypto.randomUUID().replace(/-/g, ""),
    values: ["はい", "猫の世話", "2025/10/12"],
  },
]);

export const columnAtom = atom(["Done", "Title", "Due"]);

export const footerAtom = atom(["count(\"はい\")", "", ""])
