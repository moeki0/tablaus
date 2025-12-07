"use client";

import { useEffect, useRef, useState } from "react";
import * as autosizeInput from "autosize-input";
import { emitTableUpdated } from "@/lib/tableUpdateEvent";

export function TableTitle({
  id,
  initialName,
}: {
  id: string;
  initialName: string;
}) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(initialName);
    if (ref.current) {
      autosizeInput(ref.current);
    }
  }, [initialName]);

  const ref = useRef(null);

  const save = async (next: string) => {
    if (!id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tables/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: next }),
      });
      if (res.ok) {
        emitTableUpdated(id);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-1 items-center gap-2 min-w-[200px]">
      <input
        ref={ref}
        className="font-bold bg-transparent w-full min-w-0 border-gray-300 focus:outline-none focus:border-gray-500"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={(e) => save(e.target.value)}
      />
    </div>
  );
}
