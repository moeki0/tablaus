"use client";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { RecentTableTracker } from "./RecentTableTracker";
import { TableSidebar } from "./TableSidebar";
import { Table } from "./table";

type TableSummary = { id: string; name: string };

export function TableWorkspace({
  tableList,
  activeId,
  tableId,
  initialCsv,
  initialName,
}: {
  tableList: TableSummary[];
  activeId: string;
  tableId: string;
  initialCsv: string;
  initialName: string;
}) {
  return (
    <PanelGroup direction="horizontal" className="h-screen">
      <Panel
        defaultSize={22}
        minSize={16}
        maxSize={40}
        className="min-w-[200px]"
      >
        <div className="h-full border-r border-gray-200 bg-gray-50">
          <div className="flex h-full flex-col overflow-hidden">
            <TableSidebar tables={tableList} activeId={activeId} />
          </div>
        </div>
      </Panel>
      <PanelResizeHandle className="w-1 translate-x-[-2px] opacity-0 hover:opacity-100 transition bg-gray-200 hover:bg-gray-300 focus-visible:outline-2 focus-visible:outline-blue-500 cursor-col-resize" />
      <Panel>
        <div className="h-screen overflow-auto">
          <Table
            key={tableId}
            tableId={tableId}
            initialCsv={initialCsv}
            initialName={initialName}
          />
          <RecentTableTracker tableId={tableId} />
        </div>
      </Panel>
    </PanelGroup>
  );
}
