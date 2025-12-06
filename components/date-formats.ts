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

export const timeFormats = [
  { pattern: "HH:mm:ss", output: "HH:mm:ss", matcher: /^\d{2}:\d{2}:\d{2}$/ },
  { pattern: "H:mm:ss", output: "H:mm:ss", matcher: /^\d{1,2}:\d{2}:\d{2}$/ },
  { pattern: "HH:mm", output: "HH:mm", matcher: /^\d{2}:\d{2}$/ },
  { pattern: "H:mm", output: "H:mm", matcher: /^\d{1,2}:\d{2}$/ },
  { pattern: "HHmmss", output: "HHmmss", matcher: /^\d{6}$/ },
  { pattern: "Hmmss", output: "Hmmss", matcher: /^\d{5}$/ },
  { pattern: "HHmm", output: "HHmm", matcher: /^\d{4}$/ },
  { pattern: "Hmm", output: "Hmm", matcher: /^\d{3}$/ },
] as const;

export const dateTimeFormats = [
  {
    pattern: "yyyy/MM/dd HH:mm:ss",
    output: "yyyy/MM/dd HH:mm:ss",
    matcher: /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/,
  },
  {
    pattern: "yyyy/MM/dd HH:mm",
    output: "yyyy/MM/dd HH:mm",
    matcher: /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/,
  },
  {
    pattern: "yyyy/M/d H:mm:ss",
    output: "yyyy/M/d H:mm:ss",
    matcher: /^\d{4}\/\d{1,2}\/\d{1,2} \d{1,2}:\d{2}:\d{2}$/,
  },
  {
    pattern: "yyyy/M/d H:mm",
    output: "yyyy/M/d H:mm",
    matcher: /^\d{4}\/\d{1,2}\/\d{1,2} \d{1,2}:\d{2}$/,
  },
  {
    pattern: "yyyy-MM-dd HH:mm:ss",
    output: "yyyy-MM-dd HH:mm:ss",
    matcher: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
  },
  {
    pattern: "yyyy-MM-dd HH:mm",
    output: "yyyy-MM-dd HH:mm",
    matcher: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/,
  },
  {
    pattern: "yyyy-M-d H:mm:ss",
    output: "yyyy-M-d H:mm:ss",
    matcher: /^\d{4}-\d{1,2}-\d{1,2} \d{1,2}:\d{2}:\d{2}$/,
  },
  {
    pattern: "yyyy-M-d H:mm",
    output: "yyyy-M-d H:mm",
    matcher: /^\d{4}-\d{1,2}-\d{1,2} \d{1,2}:\d{2}$/,
  },
  {
    pattern: "yyyy.MM.dd HH:mm:ss",
    output: "yyyy.MM.dd HH:mm:ss",
    matcher: /^\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}:\d{2}$/,
  },
  {
    pattern: "yyyy.MM.dd HH:mm",
    output: "yyyy.MM.dd HH:mm",
    matcher: /^\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}$/,
  },
  {
    pattern: "yyyy.M.d H:mm:ss",
    output: "yyyy.M.d H:mm:ss",
    matcher: /^\d{4}\.\d{1,2}\.\d{1,2} \d{1,2}:\d{2}:\d{2}$/,
  },
  {
    pattern: "yyyy.M.d H:mm",
    output: "yyyy.M.d H:mm",
    matcher: /^\d{4}\.\d{1,2}\.\d{1,2} \d{1,2}:\d{2}$/,
  },
  {
    pattern: "yyyy年M月d日 H:mm:ss",
    output: "yyyy年M月d日 H:mm:ss",
    matcher: /^\d{4}年\d{1,2}月\d{1,2}日 \d{1,2}:\d{2}:\d{2}$/,
  },
  {
    pattern: "yyyy年M月d日 H:mm",
    output: "yyyy年M月d日 H:mm",
    matcher: /^\d{4}年\d{1,2}月\d{1,2}日 \d{1,2}:\d{2}$/,
  },
] as const;
