/* eslint-disable @typescript-eslint/no-explicit-any */
import _ from "lodash";
import { dateFormats } from "./date-formats";
import { differenceInYears, format, isValid, parse } from "date-fns";
import "ses";

type RowLike = { values: Record<string, string> };

type EvalContext = {
  rows: RowLike[];
  columns: string[];
  rowValues?: Record<string, string>;
  rowIndex?: number;
  columnIndex?: number;
  depth?: number;
};

type EvaluationResult = {
  isFormula: boolean;
  value: unknown;
  error: string | null;
};

const MAX_RECURSION_DEPTH = 4;

export const isFormulaContent = (value?: string | null): value is string => {
  if (!value) return false;
  return value.trimStart().startsWith("%");
};

export function evaluateFormulaContent(
  value: string,
  context: EvalContext
): EvaluationResult {
  if (!isFormulaContent(value)) {
    return { isFormula: false, value, error: null };
  }
  const expression = stripFormulaPrefix(value);
  if (!expression) {
    return { isFormula: true, value: null, error: "empty formula" };
  }
  try {
    const result = runExpression(expression, context);
    return { isFormula: true, value: result, error: null };
  } catch (error) {
    return {
      isFormula: true,
      value: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export const stringifyFormulaValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }
  return String(value);
};

const stripFormulaPrefix = (value: string): string => {
  let expr = value.trimStart();
  while (expr.startsWith("%")) {
    expr = expr.slice(1).trimStart();
  }
  return expr;
};

const runExpression = (expression: string, context: EvalContext): unknown => {
  if ((context.depth ?? 0) > MAX_RECURSION_DEPTH) {
    throw new Error("formula recursion limit reached");
  }

  const nextContext: EvalContext = {
    ...context,
    depth: (context.depth ?? 0) + 1,
  };

  const prop = (name: string) => resolveProperty(name, nextContext);
  const button = (
    label: string,
    onClick: (rowIndex: number, columnIndex: number, rows: RowLike[]) => void
  ) => ({
    __button: true as const,
    label,
    onClick,
  });

  const c = new Compartment({
    console,
    rows: nextContext.rows,
    columns: nextContext.columns,
    row: nextContext.rowValues,
    rowValues: nextContext.rowValues,
    rowIndex: nextContext.rowIndex,
    columnIndex: nextContext.columnIndex,
    Math: Math,
    _: _ as typeof import("lodash"),
    sum: () => {
      const i = nextContext.columnIndex;
      if (i !== undefined) {
        return _.sum(
          nextContext.rows.map((r) => Number(Object.values(r.values)[i]))
        );
      } else {
        return 0;
      }
    },
    my: prop,
    button,
    today: () => format(new Date(), "yyyy/MM/dd"),
    age: (d: Date) => {
      return differenceInYears(new Date(), d);
    },
  });

  try {
    return c.evaluate(expression);
  } catch (e: any) {
    return e.message;
  }
};

const resolveProperty = (name: string, context: EvalContext): unknown => {
  const idx = context.columns.findIndex(
    (c) => c.toLowerCase() === name.toLowerCase()
  );
  if (idx === -1) return null;
  const columnName = context.columns[idx];
  const valueFromRow =
    context.rowValues ?? context.rows[context.rowIndex ?? 0]?.values;
  const raw = valueFromRow ? valueFromRow[columnName] : null;
  if (typeof raw === "string" && isFormulaContent(raw)) {
    const evaluated = evaluateFormulaContent(raw, {
      ...context,
      rowValues: valueFromRow ?? undefined,
    });
    return evaluated.value;
  }
  if (!raw) {
    return raw;
  }
  for (const { pattern, matcher } of dateFormats) {
    if (matcher && !matcher.test(raw)) {
      continue;
    }
    const parsed = parse(raw, pattern, new Date());
    if (isValid(parsed)) {
      return parsed;
    }
  }
  return raw;
};
