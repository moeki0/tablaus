export const TABLE_UPDATED_EVENT = "table-updated";

export function emitTableUpdated(id: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TABLE_UPDATED_EVENT, { detail: { id } }));
}
