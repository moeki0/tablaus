"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { TABLE_UPDATED_EVENT } from "@/lib/tableUpdateEvent";
import { GoPlus } from "react-icons/go";
import { SignInOutButton } from "./auth/SignInOutButton";
import { FiEdit } from "react-icons/fi";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [creating, setCreating] = useState(false);

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

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("failed to create table");
      const data = (await res.json()) as { id: string };
      router.push(`/tables/${data.id}`);
      onNavigate?.();
    } catch (err) {
      console.error(err);
      alert("テーブルの作成に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className="p-2 md:px-4 flex justify-between items-center">
        <SignInOutButton />
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="inline-flex items-center justify-center cursor-default rounded-xl hover:bg-gray-100 border border-gray-300 shadow p-1.5 transition bg-gray-50 disabled:opacity-60"
          aria-label="Create table"
        >
          <FiEdit size={18} className="stroke-gray-600" />
        </button>
      </div>
      <div className="h-[calc(100vh-55px)] overflow-y-scroll">
        {list.length === 0 ? (
          <div className="p-2 md:p-4 pt-0! text-sm text-gray-500"></div>
        ) : (
          <nav className="p-2 pt-0!">
            {list.map((t) => {
              const isActive = t.id === activeId;
              return (
                <Link
                  key={t.id}
                  href={`/tables/${t.id}`}
                  onClick={onNavigate}
                  className={`block font-semibold px-2 md:px-4 py-[5px] rounded text-sm truncate cursor-default transition ${
                    isActive ? "bg-gray-200 text-gray-700" : "text-gray-600"
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
