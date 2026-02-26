"use client";

import { useMemo } from "react";
import { Surface } from "@cloudflare/kumo";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Legend,
  Tooltip as ChartTooltip,
} from "chart.js";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import type { Item } from "@/lib/types";
import {
  valueScore,
  getUsageFraction,
  costPerDay,
} from "@/lib/calculations";

ChartJS.register(
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Legend,
  ChartTooltip
);

interface ChartsProps {
  items: Item[];
}

function useChartColors() {
  const isDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  return {
    text: isDark ? "#f5f5f7" : "#1d1d1f",
    text2: isDark ? "#98989d" : "#86868b",
    grid: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
    green: isDark ? "#30d158" : "#34c759",
    blue: isDark ? "#0a84ff" : "#0071e3",
    yellow: isDark ? "#ff9f0a" : "#ff9500",
    red: isDark ? "#ff453a" : "#ff3b30",
    palette: isDark
      ? ["#0a84ff", "#30d158", "#ff9f0a", "#ff453a", "#bf5af2", "#64d2ff", "#ffd60a", "#ac8e68"]
      : ["#0071e3", "#34c759", "#ff9500", "#ff3b30", "#af52de", "#5ac8fa", "#ffcc00", "#a2845e"],
  };
}

const FONT = {
  family:
    "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
};

export default function Charts({ items }: ChartsProps) {
  const c = useChartColors();

  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {};
    items.forEach((it) => {
      const cat = it.category || "Uncategorized";
      totals[cat] = (totals[cat] || 0) + it.price;
    });
    return {
      labels: Object.keys(totals),
      datasets: [
        {
          data: Object.values(totals),
          backgroundColor: c.palette.slice(0, Object.keys(totals).length),
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    };
  }, [items, c.palette]);

  const valueDistData = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0];
    const bucketLabels = ["0–20", "20–40", "40–60", "60–80", "80–100"];
    items.forEach((it) => {
      const vs = Math.min(100, valueScore(it));
      const idx = Math.min(4, Math.floor(vs / 20));
      buckets[idx]++;
    });
    const barColors = [c.red, c.yellow, c.yellow, c.green, c.green];
    return {
      labels: bucketLabels,
      datasets: [
        {
          data: buckets,
          backgroundColor: barColors.map((col) => col + "33"),
          borderColor: barColors,
          borderWidth: 1.5,
          borderRadius: 6,
          maxBarThickness: 48,
        },
      ],
    };
  }, [items, c]);

  const cpuTrendData = useMemo(() => {
    const top5 = [...items].sort((a, b) => b.price - a.price).slice(0, 5);
    const months = [1, 3, 6, 12, 18, 24, 36, 48, 60];
    return {
      labels: months.map((m) => (m >= 12 ? m / 12 + "y" : m + "mo")),
      datasets: top5.map((item, i) => {
        const usageFrac = getUsageFraction(item);
        return {
          label: item.name,
          data: months.map((m) => {
            const useDays = m * 30 * usageFrac;
            return useDays > 0 ? +(item.price / useDays).toFixed(2) : null;
          }),
          borderColor: c.palette[i],
          backgroundColor: c.palette[i] + "18",
          fill: false,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 2,
        };
      }),
    };
  }, [items, c.palette]);

  const monthlyCostData = useMemo(() => {
    const cats = [...new Set(items.map((it) => it.category || "Uncategorized"))];
    const totals: Record<string, number> = {};
    cats.forEach((cat) => {
      totals[cat] = items
        .filter((it) => (it.category || "Uncategorized") === cat)
        .reduce((sum, it) => sum + costPerDay(it) * 30, 0);
    });
    return {
      labels: ["Monthly Cost"],
      datasets: cats.map((cat, i) => ({
        label: cat,
        data: [+totals[cat].toFixed(2)],
        backgroundColor: c.palette[i % c.palette.length] + "55",
        borderColor: c.palette[i % c.palette.length],
        borderWidth: 1.5,
        borderRadius: 4,
      })),
    };
  }, [items, c.palette]);

  if (items.length === 0) {
    return (
      <div className="text-center text-kumo-subtle py-12">
        No items to chart yet.
      </div>
    );
  }

  const legendOpts = {
    position: "bottom" as const,
    labels: {
      color: c.text2,
      font: { ...FONT, size: 11 },
      padding: 14,
      usePointStyle: true,
      pointStyleWidth: 8,
    },
  };

  const scaleDefaults = {
    ticks: { color: c.text2, font: { ...FONT, size: 11 } },
    grid: { color: c.grid },
    border: { display: false },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Surface className="p-4 rounded-xl">
        <h3 className="text-sm font-semibold mb-3">Spending by Category</h3>
        <div className="chart-wrap-sm">
          <Doughnut
            data={categoryData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: "62%",
              plugins: {
                legend: legendOpts,
                tooltip: {
                  callbacks: {
                    label: (ctx) =>
                      ` ${ctx.label}: $${ctx.parsed.toLocaleString()}`,
                  },
                },
              },
            }}
          />
        </div>
      </Surface>

      <Surface className="p-4 rounded-xl">
        <h3 className="text-sm font-semibold mb-3">
          Value Score Distribution
        </h3>
        <div className="chart-wrap-sm">
          <Bar
            data={valueDistData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (ctx) =>
                      ` ${ctx.parsed.y} item${ctx.parsed.y !== 1 ? "s" : ""}`,
                  },
                },
              },
              scales: {
                x: {
                  ...scaleDefaults,
                  grid: { display: false },
                  title: {
                    display: true,
                    text: "Value Score",
                    color: c.text2,
                    font: { ...FONT, size: 11 },
                  },
                },
                y: {
                  ...scaleDefaults,
                  beginAtZero: true,
                  ticks: {
                    ...scaleDefaults.ticks,
                    stepSize: 1,
                  },
                },
              },
            }}
          />
        </div>
      </Surface>

      <Surface className="p-4 rounded-xl md:col-span-2">
        <h3 className="text-sm font-semibold mb-3">
          Cost per Use Over Time
        </h3>
        <div className="chart-wrap">
          <Line
            data={cpuTrendData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: "index", intersect: false },
              plugins: {
                legend: legendOpts,
                tooltip: {
                  callbacks: {
                    label: (ctx) =>
                      ` ${ctx.dataset.label}: $${(ctx.parsed.y ?? 0).toFixed(2)}/use`,
                  },
                },
              },
              scales: {
                x: {
                  ...scaleDefaults,
                  grid: { display: false },
                  title: {
                    display: true,
                    text: "Time Owned",
                    color: c.text2,
                    font: { ...FONT, size: 11 },
                  },
                },
                y: {
                  ...scaleDefaults,
                  beginAtZero: false,
                  title: {
                    display: true,
                    text: "$/Use",
                    color: c.text2,
                    font: { ...FONT, size: 11 },
                  },
                  ticks: {
                    ...scaleDefaults.ticks,
                    callback: (v) => "$" + Number(v).toFixed(0),
                  },
                },
              },
            }}
          />
        </div>
      </Surface>

      <Surface className="p-4 rounded-xl md:col-span-2">
        <h3 className="text-sm font-semibold mb-3">
          Monthly Cost Breakdown
        </h3>
        <div style={{ height: 120 }}>
          <Bar
            data={monthlyCostData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: "y",
              plugins: {
                legend: legendOpts,
                tooltip: {
                  callbacks: {
                    label: (ctx) =>
                      ` ${ctx.dataset.label}: $${(ctx.parsed.x ?? 0).toFixed(2)}/mo`,
                  },
                },
              },
              scales: {
                x: {
                  ...scaleDefaults,
                  stacked: true,
                  ticks: {
                    ...scaleDefaults.ticks,
                    callback: (v) => "$" + v,
                  },
                },
                y: {
                  ...scaleDefaults,
                  stacked: true,
                  grid: { display: false },
                  ticks: { display: false },
                },
              },
            }}
          />
        </div>
      </Surface>
    </div>
  );
}
