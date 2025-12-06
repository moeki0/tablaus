export const dateFormats = [
  {
    pattern: "yyyy/MM/dd",
    output: "yyyy/MM/dd",
    matcher: /^\d{4}\/\d{2}\/\d{2}$/,
  },
  {
    pattern: "yyyy/M/d",
    output: "yyyy/M/d",
    matcher: /^\d{4}\/\d{1,2}\/\d{1,2}$/,
  },
  {
    pattern: "yyyy-MM-dd",
    output: "yyyy-MM-dd",
    matcher: /^\d{4}-\d{2}-\d{2}$/,
  },
  {
    pattern: "yyyy-M-d",
    output: "yyyy-M-d",
    matcher: /^\d{4}-\d{1,2}-\d{1,2}$/,
  },
  {
    pattern: "yyyy.MM.dd",
    output: "yyyy.MM.dd",
    matcher: /^\d{4}\.\d{2}\.\d{2}$/,
  },
  {
    pattern: "yyyy.M.d",
    output: "yyyy.M.d",
    matcher: /^\d{4}\.\d{1,2}\.\d{1,2}$/,
  },
  { pattern: "yyyyMMdd", output: "yyyyMMdd", matcher: /^\d{8}$/ },
  { pattern: "M/d/yy", output: "M/d/yy", matcher: /^\d{1,2}\/\d{1,2}\/\d{2}$/ },
  { pattern: "M/d", output: "M/d", matcher: /^\d{1,2}\/\d{1,2}$/ },
  { pattern: "M-d", output: "M-d", matcher: /^\d{1,2}-\d{1,2}$/ },
  { pattern: "M.d", output: "M.d", matcher: /^\d{1,2}\.\d{1,2}$/ },
  {
    pattern: "yyyy年M月d日",
    output: "yyyy年M月d日",
    matcher: /^\d{4}年\d{1,2}月\d{1,2}日$/,
  },
  { pattern: "M月d日", output: "M月d日", matcher: /^\d{1,2}月\d{1,2}日$/ },
] as const;
