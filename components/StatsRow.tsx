"use client";

import { Surface } from "@cloudflare/kumo";
import type { Item } from "@/lib/types";
import { costPerUseDay, formatMoney } from "@/lib/calculations";

interface StatsRowProps {
  items: Item[];
}

export default function StatsRow({ items }: StatsRowProps) {
  if (items.length === 0) return null;

  const totalValue = items.reduce((s, i) => s + i.price, 0);
  const totalPerUse = items.reduce((s, i) => s + costPerUseDay(i), 0);
  const avgCpud = totalPerUse / items.length;
  const bestItem = [...items].sort(
    (a, b) => costPerUseDay(a) - costPerUseDay(b)
  )[0];

  const stats = [
    { label: "Total Invested", value: `$${totalValue.toLocaleString()}` },
    { label: "Daily Burn", value: formatMoney(totalPerUse) },
    { label: "Avg $/Use", value: formatMoney(avgCpud) },
    { label: "Best Value", value: bestItem.name },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {stats.map((stat) => (
        <Surface key={stat.label} className="p-4 rounded-xl">
          <div className="text-xs text-kumo-subtle mb-1">{stat.label}</div>
          <div className="text-lg font-semibold truncate">{stat.value}</div>
        </Surface>
      ))}
    </div>
  );
}
