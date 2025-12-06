"use client";

import { useEffect, useRef, useState } from "react";
import * as autosizeInput from "autosize-input";

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
  }, [initialName]);

  const ref = useRef(null);

  const save = async (next: string) => {
    if (!id) return;
    setSaving(true);
    try {
      await fetch(`/api/tables/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: next }),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mb-4">
      <input
        ref={ref}
        className="w-full block text-2xl bg-transparent border-gray-300 focus:outline-none focus:border-gray-500"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={(e) => save(e.target.value)}
      />
    </div>
  );
}
