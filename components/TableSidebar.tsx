"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { TABLE_UPDATED_EVENT } from "@/lib/tableUpdateEvent";
import { GoPlus } from "react-icons/go";
import { SignInOutButton } from "./auth/SignInOutButton";
import { FiEdit } from "react-icons/fi";

type TableSummary = { id: string; name: string };

export function TableSidebar({
  tables,
  activeId,
  onNavigate,
}: {
  tables: TableSummary[];
  activeId: string;
  onNavigate?: () => void;
}) {
  const [list, setList] = useState<TableSummary[]>(tables);
  const fetchTimer = useRef<number | null>(null);

  useEffect(() => {
    setList(tables);
  }, [tables]);

  useEffect(() => {
    const scheduleRefresh = () => {
      if (fetchTimer.current) {
        window.clearTimeout(fetchTimer.current);
      }
      fetchTimer.current = window.setTimeout(async () => {
        fetchTimer.current = null;
        try {
          const res = await fetch("/api/tables");
          if (!res.ok) return;
          const data = (await res.json()) as TableSummary[];
          setList(data);
        } catch (err) {
          console.error(err);
        }
      }, 300);
    };

    window.addEventListener(TABLE_UPDATED_EVENT, scheduleRefresh);
    return () => {
      window.removeEventListener(TABLE_UPDATED_EVENT, scheduleRefresh);
      if (fetchTimer.current) {
        window.clearTimeout(fetchTimer.current);
      }
    };
  }, []);

  return (
    <>
      <div className="p-2 md:px-4 flex justify-between items-center">
        <SignInOutButton />
        <Link
          href="/tables/new"
          className="inline-flex items-center justify-center cursor-default rounded-xl hover:bg-gray-100 bg-white border border-gray-300 shadow p-1.5 transition"
        >
          <FiEdit size={18} className="stroke-gray-600" />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        {list.length === 0 ? (
          <div className="p-2 md:p-4 pt-0! text-sm text-gray-500">
            まだテーブルがありません。
          </div>
        ) : (
          <nav className="p-2 pt-0!">
            {list.map((t) => {
              const isActive = t.id === activeId;
              return (
                <Link
                  key={t.id}
                  href={`/tables/${t.id}`}
                  onClick={onNavigate}
                  className={`block px-2 md:px-4 py-[5px] rounded text-sm truncate cursor-default transition ${
                    isActive ? "bg-gray-200 text-gray-900" : "text-gray-700"
                  }`}
                >
                  {t.name || "Untitled"}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </>
  );
}
