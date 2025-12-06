"use client";

import { useEffect } from "react";

export function RecentTableTracker({ tableId }: { tableId: string }) {
  useEffect(() => {
    // クッキーに最近閲覧したテーブルを記録（30日保持）
    document.cookie = `recentTableId=${tableId}; path=/; max-age=2592000; SameSite=Lax`;
  }, [tableId]);

  return null;
}
