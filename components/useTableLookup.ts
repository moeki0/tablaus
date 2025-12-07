import { useCallback, useReducer } from "react";
import { useSWRConfig } from "swr";
import {
  extractBody,
  extractColumns,
  extractFooter,
  parseCsv,
} from "./csvTable";

export type TableReference = {
  id: string;
  name: string;
  columns: string[];
  rows: Record<string, string>[];
  footer: string[];
};

const cacheKey = (id: string) => ["table-ref", id];

const fetchTable = async (id: string): Promise<string[][]> => {
  const res = await fetch(`/api/tables/${id}`);
  if (!res.ok) {
    throw new Error("failed to fetch table");
  }
  const row = await res.json();
  return parseCsv(row.csv);
};

export function useTableLookup() {
  const { cache, mutate } = useSWRConfig();
  const [, forceRender] = useReducer((c: number) => c + 1, 0);

  return useCallback(
    async (rawId: string) => {
      if (!rawId) return null;
      const id = rawId.startsWith(":") ? rawId.slice(1) : rawId;
      if (!id) return null;
      const key = cacheKey(id);
      const cached = cache.get(key.join(":")) as
        | { data?: string[][] }
        | undefined;
      if (cached?.data) {
        return cached.data || null;
      }
      return mutate(key.join(":"), fetchTable(id), { revalidate: false });
    },
    [cache, mutate, forceRender]
  );
}
