"use client";

import { useState, useMemo } from "react";
import type { Item } from "@/lib/types";
import { getCategories, sortItems, type SortKey } from "@/lib/calculations";
import StatsRow from "./StatsRow";
import ItemCard from "./ItemCard";

interface DashboardProps {
  items: Item[];
  onDelete: (id: string) => void;
}

const selectClass =
  "px-3 py-2 text-sm rounded-xl border-none outline-none appearance-none cursor-pointer transition-shadow focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-opacity-40";
const selectStyle = {
  background: "var(--color-bg-secondary)",
  color: "var(--color-text)",
};

export default function Dashboard({ items, onDelete }: DashboardProps) {
  const [sortBy, setSortBy] = useState<SortKey>("costPerDay");
  const [filterCat, setFilterCat] = useState("all");

  const categories = useMemo(() => getCategories(items), [items]);

  const sortOptions: { value: SortKey; label: string }[] = [
    { value: "costPerDay", label: "$/Use (low)" },
    { value: "costPerDayDesc", label: "$/Use (high)" },
    { value: "price", label: "Price (low)" },
    { value: "priceDesc", label: "Price (high)" },
    { value: "date", label: "Date (newest)" },
    { value: "dateOld", label: "Date (oldest)" },
    { value: "name", label: "Name" },
  ];

  const filtered = useMemo(() => {
    const f = filterCat !== "all" ? items.filter((i) => i.category === filterCat) : items;
    return sortItems(f, sortBy);
  }, [items, sortBy, filterCat]);

  return (
    <div>
      <StatsRow items={filtered} />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select
          className={selectClass}
          style={selectStyle}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          className={selectClass}
          style={selectStyle}
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
        >
          <option value="all">All</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-lg font-semibold mb-2">No items tracked yet</h3>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            No items to display.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((item, idx) => (
            <ItemCard key={item.id} item={item} index={idx} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
