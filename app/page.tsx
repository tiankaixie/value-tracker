"use client";

import { useState, useEffect, useRef } from "react";
import type { Item } from "@/lib/types";
import { getItems, deleteItem, saveItems } from "@/lib/storage";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [undoItem, setUndoItem] = useState<Item | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setItems(getItems());
  }, []);

  const handleDelete = (id: string) => {
    const toDelete = items.find((i) => i.id === id);
    if (!toDelete) return;
    setUndoItem(toDelete);
    clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoItem(null), 4000);
    setItems(deleteItem(id));
  };

  const handleUndo = () => {
    if (!undoItem) return;
    clearTimeout(undoTimer.current);
    const restored = [...items, undoItem];
    saveItems(restored);
    setItems(restored);
    setUndoItem(null);
  };

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-[28px] font-semibold tracking-tight mb-8" style={{ color: "var(--color-text)" }}>
        Value Tracker
      </h1>

      <Dashboard items={items} onDelete={handleDelete} />

      {undoItem && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 text-sm font-medium rounded-2xl z-[100]"
          style={{
            background: "var(--color-text)",
            color: "var(--color-bg)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            animation: "fadeInUp 0.25s ease",
          }}
        >
          <span>Deleted &ldquo;{undoItem.name}&rdquo;</span>
          <button
            className="underline font-semibold opacity-90 hover:opacity-100"
            onClick={handleUndo}
          >
            Undo
          </button>
        </div>
      )}
    </main>
  );
}
