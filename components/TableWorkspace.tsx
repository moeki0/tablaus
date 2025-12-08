"use client";

import { RecentTableTracker } from "./RecentTableTracker";
import { Table } from "./table";

export function TableWorkspace({
  tableId,
  initialCsv,
  initialName,
  initialQuerySpec,
  initialUpdatedAt,
}: {
  tableId: string;
  initialCsv: string;
  initialName: string;
  initialQuerySpec: string;
  initialUpdatedAt: string;
}) {
  return (
    <div className="h-screen overflow-hidden">
      <Table
        key={tableId}
        tableId={tableId}
        initialCsv={initialCsv}
        initialName={initialName}
        initialQuerySpec={initialQuerySpec}
        initialUpdatedAt={initialUpdatedAt}
      />
      <RecentTableTracker tableId={tableId} />
    </div>
  );
}
