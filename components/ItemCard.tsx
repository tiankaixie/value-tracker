"use client";

import type { Item } from "@/lib/types";
import {
  daysSince,
  costPerDay,
  costPerUseDay,
  valueScore,
  valueBarColor,
  formatMoney,
  costClass,
} from "@/lib/calculations";

interface ItemCardProps {
  item: Item;
  index: number;
  onDelete: (id: string) => void;
}

export default function ItemCard({ item, index, onDelete }: ItemCardProps) {
  const cpud = costPerUseDay(item);
  const cpd = costPerDay(item);
  const days = daysSince(item.purchaseDate);
  const vs = valueScore(item);
  const barColor = valueBarColor(vs);
  const cls = costClass(cpud);

  return (
    <div
      className="item-card-animate relative group p-5 rounded-2xl transition-all duration-200"
      style={{
        animationDelay: `${index * 0.04}s`,
        background: "var(--color-bg)",
        border: "1px solid var(--color-border)",
        boxShadow: "0 1px 3px var(--color-shadow)",
      }}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate">{item.name}</h3>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mt-1.5" style={{ color: "var(--color-text-secondary)" }}>
            <span>${item.price.toLocaleString()}</span>
            <span>{days.toLocaleString()} days</span>
            {item.daysPerWeek < 7 && <span>{item.daysPerWeek}d/wk</span>}
            <span>{(days / 365).toFixed(1)}yr owned</span>
            {item.category && (
              <span
                className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{
                  background: "var(--color-bg-secondary)",
                  color: "var(--color-text-secondary)",
                }}
              >
                {item.category}
              </span>
            )}
          </div>
          {item.notes && (
            <div className="text-xs italic mt-1.5 truncate" style={{ color: "var(--color-text-secondary)" }}>
              {item.notes}
            </div>
          )}
          <div className="value-bar mt-3" title={`Value: ${vs.toFixed(0)}%`}>
            <div className="value-bar-fill" style={{ width: `${vs}%`, background: barColor }} />
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className={`text-xl font-bold cost-${cls}`}>{formatMoney(cpud)}</div>
          <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>per use</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
            {formatMoney(cpd)}/day
          </div>
        </div>
      </div>
      <button
        className="absolute top-3 right-3 text-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 w-6 h-6 flex items-center justify-center rounded-full hover:bg-[var(--color-bg-secondary)]"
        style={{ color: "var(--color-text-secondary)" }}
        onClick={() => onDelete(item.id)}
        aria-label="Delete item"
      >
        ×
      </button>
    </div>
  );
}
