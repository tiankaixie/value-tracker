import type { Item } from "./types";
import seedData from "../data.json";

const STORAGE_KEY = "value-tracker-items";
const SEEDED_KEY = "value-tracker-seeded";

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
  // Seed from data.json on first load only
  if (!localStorage.getItem(SEEDED_KEY)) {
    const items = seedData.items as Item[];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    localStorage.setItem(SEEDED_KEY, "1");
    return items;
  }
  return [];
}

export function saveItems(items: Item[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function deleteItem(id: string): Item[] {
  const items = getItems().filter((i) => i.id !== id);
  saveItems(items);
  return items;
}
