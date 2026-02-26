"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs } from "@cloudflare/kumo";
import type { Item } from "@/lib/types";
import { getItems, addItem, updateItem, deleteItem } from "@/lib/storage";
import Dashboard from "@/components/Dashboard";
import WhatIf from "@/components/WhatIf";
import Charts from "@/components/Charts";

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    setItems(getItems());
  }, []);

  const handleAdd = useCallback((item: Item) => {
    setItems(addItem(item));
  }, []);

  const handleUpdate = useCallback((id: string, updates: Partial<Item>) => {
    setItems(updateItem(id, updates));
  }, []);

  const handleDelete = useCallback((id: string) => {
    setItems(deleteItem(id));
  }, []);

  const handleImport = useCallback((imported: Item[]) => {
    setItems(imported);
  }, []);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Value Tracker</h1>

      <Tabs
        variant="segmented"
        value={activeTab}
        onValueChange={setActiveTab}
        tabs={[
          { value: "dashboard", label: "Dashboard" },
          { value: "whatif", label: "What If" },
          { value: "charts", label: "Charts" },
        ]}
        className="mb-6"
      />

      {activeTab === "dashboard" && (
        <Dashboard
          items={items}
          onAdd={handleAdd}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onImport={handleImport}
        />
      )}
      {activeTab === "whatif" && <WhatIf />}
      {activeTab === "charts" && <Charts items={items} />}
    </main>
  );
}
