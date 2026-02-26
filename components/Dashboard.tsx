"use client";

import { useState, useMemo } from "react";
import { Select, Button, Empty, useKumoToastManager } from "@cloudflare/kumo";
import { Plus } from "@phosphor-icons/react";
import type { Item } from "@/lib/types";
import {
  getCategories,
  sortItems,
  type SortKey,
} from "@/lib/calculations";
import StatsRow from "./StatsRow";
import ItemCard from "./ItemCard";
import ItemDialog from "./ItemDialog";
import ExportButtons from "./ExportButtons";

interface DashboardProps {
  items: Item[];
  onAdd: (item: Item) => void;
  onUpdate: (id: string, updates: Partial<Item>) => void;
  onDelete: (id: string) => void;
  onImport: (items: Item[]) => void;
}

export default function Dashboard({
  items,
  onAdd,
  onUpdate,
  onDelete,
  onImport,
}: DashboardProps) {
  const [sortBy, setSortBy] = useState<SortKey>("costPerDay");
  const [filterCat, setFilterCat] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);

  const toast = useKumoToastManager();
  const categories = useMemo(() => getCategories(items), [items]);

  const sortLabels: Record<SortKey, string> = {
    costPerDay: "$/Use (low)",
    costPerDayDesc: "$/Use (high)",
    price: "Price (low)",
    priceDesc: "Price (high)",
    date: "Date (newest)",
    dateOld: "Date (oldest)",
    name: "Name",
  };

  const filtered = useMemo(() => {
    const f = filterCat && filterCat !== "all"
      ? items.filter((i) => i.category === filterCat)
      : items;
    return sortItems(f, sortBy);
  }, [items, sortBy, filterCat]);

  const handleSave = (data: Omit<Item, "id" | "createdAt">) => {
    if (editItem) {
      onUpdate(editItem.id, data);
      toast.add({ title: "Item updated", variant: "default" });
    } else {
      const newItem: Item = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      onAdd(newItem);
      toast.add({ title: "Item added", variant: "default" });
    }
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    toast.add({ title: "Item deleted", variant: "default" });
  };

  const handleEdit = (item: Item) => {
    setEditItem(item);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditItem(null);
    setDialogOpen(true);
  };

  return (
    <div>
      <StatsRow items={filtered} />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select
          label="Sort by"
          hideLabel
          value={sortBy}
          onValueChange={(v) => setSortBy(v as SortKey)}
          renderValue={(v: SortKey) => sortLabels[v] ?? v}
        >
          <Select.Option value="costPerDay">$/Use (low)</Select.Option>
          <Select.Option value="costPerDayDesc">$/Use (high)</Select.Option>
          <Select.Option value="price">Price (low)</Select.Option>
          <Select.Option value="priceDesc">Price (high)</Select.Option>
          <Select.Option value="date">Date (newest)</Select.Option>
          <Select.Option value="dateOld">Date (oldest)</Select.Option>
          <Select.Option value="name">Name</Select.Option>
        </Select>

        <Select
          label="Category"
          hideLabel
          value={filterCat}
          onValueChange={(v) => setFilterCat(v as string)}
          renderValue={(v: string) => {
            if (v === "all") return "All";
            return v;
          }}
        >
          <Select.Option value="all">All</Select.Option>
          {categories.map((c) => (
            <Select.Option key={c} value={c}>
              {c}
            </Select.Option>
          ))}
        </Select>

        <div className="ml-auto flex gap-2">
          <ExportButtons items={items} />
          <Button variant="primary" size="sm" icon={Plus} onClick={handleAddNew}>
            Add
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty
          title="No items tracked yet"
          description="Add your first item to start tracking its value over time."
          contents={
            <Button variant="primary" icon={Plus} onClick={handleAddNew}>
              Add Item
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((item, idx) => (
            <ItemCard
              key={item.id}
              item={item}
              index={idx}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <ItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editItem}
        categories={categories}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
