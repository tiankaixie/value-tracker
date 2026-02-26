import type { Item } from "./types";
import seedData from "../data.json";

const STORAGE_KEY = "value-tracker-items";

export function getItems(): Item[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  // Seed from data.json on first load
  const items = seedData.items as Item[];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  return items;
}

export function saveItems(items: Item[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addItem(item: Item): Item[] {
  const items = getItems();
  items.push(item);
  saveItems(items);
  return items;
}

export function updateItem(id: string, updates: Partial<Item>): Item[] {
  const items = getItems();
  const idx = items.findIndex((i) => i.id === id);
  if (idx !== -1) {
    items[idx] = { ...items[idx], ...updates };
  }
  saveItems(items);
  return items;
}

export function deleteItem(id: string): Item[] {
  const items = getItems().filter((i) => i.id !== id);
  saveItems(items);
  return items;
}

export function exportJSON(items: Item[]): void {
  const blob = new Blob([JSON.stringify({ items }, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "value-tracker.json";
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportCSV(items: Item[]): void {
  const headers = [
    "name",
    "price",
    "purchaseDate",
    "category",
    "expectedYears",
    "daysPerWeek",
    "notes",
  ];
  const rows = items.map((it) =>
    headers
      .map((h) => '"' + String(it[h as keyof Item] || "").replace(/"/g, '""') + '"')
      .join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "value-tracker.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

export function importJSON(file: File): Promise<Item[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        const items = data.items || data;
        saveItems(items);
        resolve(items);
      } catch {
        reject(new Error("Invalid JSON file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
