/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";
import {
  evaluateFormulaContent,
  isFormulaContent,
  stringifyFormulaValue,
} from "./formula";

describe("isFormulaContent", () => {
  it("detects % 付きの式だけをtrueにする", () => {
    expect(isFormulaContent("% 1 + 1")).toBe(true);
    expect(isFormulaContent(" % true")).toBe(true);
    expect(isFormulaContent("text")).toBe(false);
    expect(isFormulaContent("")).toBe(false);
  });
});

describe("evaluateFormulaContent", () => {
  it("JS式として評価できる", () => {
    const result = evaluateFormulaContent("% 1 + 2 * 3 ** 2", {
      rows: [],
      columns: [],
    });
    expect(result.isFormula).toBe(true);
    expect(result.error).toBeNull();
    expect(result.value).toBe(19);
  });

  it("prop参照と三項演算子を評価できる", () => {
    const rows = [{ values: { Done: "はい", Title: "" } }];
    const columns = ["Done", "Title"];
    const result = evaluateFormulaContent(
      '% prop("Done") === "はい" ? "OK" : "NG"',
      {
        rows,
        columns,
        rowValues: rows[0].values,
        rowIndex: 0,
        columnIndex: 1,
      }
    );
    expect(result.isFormula).toBe(true);
    expect(result.value).toBe("OK");
  });

  it("lodashが利用できる", () => {
    const rows = [
      { values: { Num: "1" } },
      { values: { Num: "2" } },
      { values: { Num: "3" } },
    ];
    const columns = ["Num"];
    const result = evaluateFormulaContent(
      "% _.sum(rows.map(r => Number(r.values['Num'])))",
      {
        rows,
        columns,
        columnIndex: 0,
      }
    );
    expect(result.value).toBe(6);
  });

  it("buttonを返せる", () => {
    const result = evaluateFormulaContent(
      '% button("クリック", (row, col, rows) => { rows[row].values["Num"] = "2"; })',
      {
        rows: [{ values: { Num: "1" } }],
        columns: ["Num"],
        columnIndex: 0,
        rowIndex: 0,
      }
    );
    expect(result.isFormula).toBe(true);
    expect(typeof (result.value as any).onClick).toBe("function");
    expect((result.value as any).__button).toBe(true);
  });

  it("非Formula文字列はそのまま返す", () => {
    const result = evaluateFormulaContent("plain", {
      rows: [],
      columns: [],
    });
    expect(result.isFormula).toBe(false);
    expect(result.value).toBe("plain");
  });
});

describe("stringifyFormulaValue", () => {
  it("nullやundefinedを空文字にする", () => {
    expect(stringifyFormulaValue(null)).toBe("");
    expect(stringifyFormulaValue(undefined)).toBe("");
  });

  it("booleanとnumberを文字列化する", () => {
    expect(stringifyFormulaValue(true)).toBe("true");
    expect(stringifyFormulaValue(false)).toBe("false");
    expect(stringifyFormulaValue(12)).toBe("12");
  });
});
