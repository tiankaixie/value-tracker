"use client";

import { Surface, Badge } from "@cloudflare/kumo";
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
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
}

export default function ItemCard({
  item,
  index,
  onEdit,
  onDelete,
}: ItemCardProps) {
  const cpud = costPerUseDay(item);
  const cpd = costPerDay(item);
  const days = daysSince(item.purchaseDate);
  const vs = valueScore(item);
  const barColor = valueBarColor(vs);
  const cls = costClass(cpud);

  return (
    <Surface
      className="item-card-animate relative group p-4 rounded-xl cursor-pointer hover:ring-1 hover:ring-kumo-border-muted transition-all"
      style={{ animationDelay: `${index * 0.04}s` }}
      onClick={() => onEdit(item)}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate">{item.name}</h3>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-kumo-subtle mt-1">
            <span>${item.price.toLocaleString()}</span>
            <span>{days.toLocaleString()} days</span>
            {item.daysPerWeek < 7 && <span>{item.daysPerWeek}d/wk</span>}
            <span>{(days / 365).toFixed(1)}yr owned</span>
            {item.category && (
              <Badge variant="secondary">{item.category}</Badge>
            )}
          </div>
          {item.notes && (
            <div className="text-xs text-kumo-subtle italic mt-1.5 truncate">
              {item.notes}
            </div>
          )}
          <div
            className="value-bar mt-3 bg-kumo-fill"
            title={`Value: ${vs.toFixed(0)}%`}
          >
            <div
              className="value-bar-fill"
              style={{ width: `${vs}%`, background: barColor }}
            />
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className={`text-xl font-bold cost-${cls}`}>
            {formatMoney(cpud)}
          </div>
          <div className="text-xs text-kumo-subtle">per use</div>
          <div className="text-xs text-kumo-subtle mt-0.5">
            {formatMoney(cpd)}/day
          </div>
        </div>
      </div>
      <button
        className="absolute top-2 right-2 text-kumo-subtle hover:text-kumo-default text-sm opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(item.id);
        }}
        aria-label="Delete item"
      >
        &times;
      </button>
    </Surface>
  );
}
