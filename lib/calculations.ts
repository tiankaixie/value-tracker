import type { Item } from "./types";

export function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(1, Math.floor(diff / 86400000));
}

export function getUsageFraction(item: Item): number {
  return (item.daysPerWeek || 7) / 7;
}

export function useDaysSince(item: Item): number {
  return daysSince(item.purchaseDate) * getUsageFraction(item);
}

export function costPerDay(item: Item): number {
  return item.price / daysSince(item.purchaseDate);
}

export function costPerUseDay(item: Item): number {
  return item.price / useDaysSince(item);
}

export function formatMoney(n: number): string {
  return n < 0.01 ? "<$0.01" : "$" + n.toFixed(2);
}

export function costClass(cpd: number): "excellent" | "good" | "high" {
  if (cpd < 1) return "excellent";
  if (cpd < 5) return "good";
  return "high";
}

export function valueScore(item: Item): number {
  const useDays = useDaysSince(item);
  if (item.expectedYears) {
    const expectedUseDays =
      item.expectedYears * 365 * getUsageFraction(item);
    return Math.min(100, (useDays / expectedUseDays) * 100);
  }
  const target = item.price / 0.1;
  return Math.min(100, (useDays / target) * 100);
}

export function valueBarColor(score: number): string {
  if (score > 66) return "var(--color-green)";
  if (score > 33) return "var(--color-yellow)";
  return "var(--color-red)";
}

export function getCategories(items: Item[]): string[] {
  return [...new Set(items.map((i) => i.category).filter(Boolean))];
}

export type SortKey =
  | "costPerDay"
  | "costPerDayDesc"
  | "price"
  | "priceDesc"
  | "date"
  | "dateOld"
  | "name";

export function sortItems(items: Item[], sortBy: SortKey): Item[] {
  const sorted = [...items];
  const sorters: Record<SortKey, (a: Item, b: Item) => number> = {
    costPerDay: (a, b) => costPerUseDay(a) - costPerUseDay(b),
    costPerDayDesc: (a, b) => costPerUseDay(b) - costPerUseDay(a),
    price: (a, b) => a.price - b.price,
    priceDesc: (a, b) => b.price - a.price,
    date: (a, b) =>
      new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime(),
    dateOld: (a, b) =>
      new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime(),
    name: (a, b) => a.name.localeCompare(b.name),
  };
  sorted.sort(sorters[sortBy] || sorters.costPerDay);
  return sorted;
}
