import { atom } from "jotai";

type CsvUpdater = string | ((prev: string) => string);

type TableHistory = {
  past: string[];
  present: string;
  future: string[];
  draftAnchor: string | null;
};

const tableHistoryAtom = atom<TableHistory>({
  past: [],
  present: "",
  future: [],
  draftAnchor: null,
});

export const tableAtom = atom<string, [CsvUpdater], void>(
  (get) => get(tableHistoryAtom).present,
  (get, set, update) => {
    const { past, present, future, draftAnchor } = get(tableHistoryAtom);
    const next =
      typeof update === "function" ? update(present) : (update ?? present);
    if (next === present) return;
    if (draftAnchor !== null) {
      set(tableHistoryAtom, {
        past,
        present: next,
        future: [],
        draftAnchor,
      });
      return;
    }
    set(tableHistoryAtom, {
      past: [...past, present],
      present: next,
      future: [],
      draftAnchor,
    });
  }
);

export const resetTableAtom = atom(null, (_, set, initial: string) => {
  set(tableHistoryAtom, {
    past: [],
    present: initial,
    future: [],
    draftAnchor: null,
  });
});

export const startDraftAtom = atom(null, (get, set) => {
  const { draftAnchor, present, ...rest } = get(tableHistoryAtom);
  if (draftAnchor !== null) return;
  set(tableHistoryAtom, { ...rest, draftAnchor: present, present });
});

export const commitDraftAtom = atom(null, (get, set) => {
  const { past, present, future, draftAnchor } = get(tableHistoryAtom);
  if (draftAnchor === null) return;
  if (draftAnchor === present) {
    set(tableHistoryAtom, { past, present, future, draftAnchor: null });
    return;
  }
  set(tableHistoryAtom, {
    past: [...past, draftAnchor],
    present,
    future: [],
    draftAnchor: null,
  });
});

export const undoAtom = atom(null, (get, set) => {
  const { past, present, future } = get(tableHistoryAtom);
  if (past.length === 0) return;
  const previous = past[past.length - 1];
  const restPast = past.slice(0, -1);
  set(tableHistoryAtom, {
    past: restPast,
    present: previous,
    future: [present, ...future],
    draftAnchor: null,
  });
});

export const redoAtom = atom(null, (get, set) => {
  const { past, present, future } = get(tableHistoryAtom);
  if (future.length === 0) return;
  const [next, ...restFuture] = future;
  set(tableHistoryAtom, {
    past: [...past, present],
    present: next,
    future: restFuture,
    draftAnchor: null,
  });
});
