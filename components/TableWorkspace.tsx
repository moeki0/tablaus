"use client";

import { useEffect, useState } from "react";
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
  initialQuerySpec,
  initialUpdatedAt,
}: {
  tableList: TableSummary[];
  activeId: string;
  tableId: string;
  initialCsv: string;
  initialName: string;
  initialQuerySpec: string;
  initialUpdatedAt: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 768px)");
    const handler = (event: MediaQueryListEvent | MediaQueryList) => {
      if (!event.matches) {
        setSidebarOpen(false);
      }
    };
    handler(media);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  return (
    <>
      <div className="relative h-screen md:hidden">
        <div
          className={`fixed inset-0 z-40 transition-all duration-200 ease-out ${
            sidebarOpen ? "pointer-events-auto" : "pointer-events-none"
          }`}
        >
          <div
            className={`absolute inset-0 bg-black/30 transition-opacity duration-200 ${
              sidebarOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
          <div
            className={`absolute bottom-0 left-0 top-0 w-72 max-w-[80%] border-r border-gray-200 bg-gray-50 shadow-lg transform transition-transform duration-200 ease-out ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex h-full flex-col overflow-hidden">
              <TableSidebar
                tables={tableList}
                activeId={activeId}
                onNavigate={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        </div>
        <div className="h-full overflow-auto">
          <Table
            key={tableId}
            tableId={tableId}
            initialCsv={initialCsv}
            initialName={initialName}
            initialQuerySpec={initialQuerySpec}
            initialUpdatedAt={initialUpdatedAt}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
          <RecentTableTracker tableId={tableId} />
        </div>
      </div>

      <div className="hidden md:block">
        <PanelGroup direction="horizontal" className="h-screen">
          <Panel
            defaultSize={22}
            minSize={16}
            maxSize={40}
            className="min-w-[200px]"
          >
            <div className="h-full border-gray-200 bg-gray-50">
              <div className="flex h-full flex-col overflow-hidden">
                <TableSidebar tables={tableList} activeId={activeId} />
              </div>
            </div>
          </Panel>
          <PanelResizeHandle className="w-1 border-gray-200 border-r bg-gray-50 hover:opacity-100 transition focus-visible:outline-blue-500 cursor-col-resize" />
          <Panel>
            <div className="h-screen overflow-auto">
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
          </Panel>
        </PanelGroup>
      </div>
    </>
  );
}
