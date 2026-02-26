"use client";

import { useState, useMemo } from "react";
import { Input, Surface, Table } from "@cloudflare/kumo";
import { formatMoney, costClass } from "@/lib/calculations";

export default function WhatIf() {
  const [price, setPrice] = useState("");
  const [years, setYears] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState("7");

  const result = useMemo(() => {
    const p = parseFloat(price);
    const y = parseFloat(years);
    const dpw = parseFloat(daysPerWeek) || 7;
    if (!p || !y) return null;

    const usageFraction = dpw / 7;
    const dailyPerUse = p / (y * 365 * usageFraction);
    const dailyRaw = p / (y * 365);
    const monthly = p / (y * 12);
    const weekly = p / (y * 52);

    const milestones = [0.5, 1, 2, 3, 5, 7, 10].filter((m) => m <= y * 2);
    const timeline = milestones.map((m) => ({
      years: m,
      costPerUse: p / (m * 365 * usageFraction),
    }));

    return { dailyPerUse, dailyRaw, monthly, weekly, timeline };
  }, [price, years, daysPerWeek]);

  return (
    <div className="max-w-lg">
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Input
          label="Item Price ($)"
          type="number"
          placeholder="999"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <Input
          label="Expected Years"
          type="number"
          placeholder="5"
          value={years}
          onChange={(e) => setYears(e.target.value)}
        />
        <Input
          label="Days/Week"
          type="number"
          placeholder="7"
          value={daysPerWeek}
          onChange={(e) => setDaysPerWeek(e.target.value)}
        />
      </div>

      {result && (
        <>
          <Surface className="p-6 rounded-xl mb-6 text-center">
            <div className={`text-3xl font-bold cost-${costClass(result.dailyPerUse)}`}>
              {formatMoney(result.dailyPerUse)}
              <span className="text-base font-normal text-kumo-subtle">
                /use
              </span>
            </div>
            <div className="text-sm text-kumo-subtle mt-2">
              {formatMoney(result.dailyRaw)}/day &middot; $
              {result.monthly.toFixed(2)}/month &middot; $
              {result.weekly.toFixed(2)}/week
            </div>
          </Surface>

          <h3 className="text-sm font-semibold mb-3">
            Cost per Use Over Time
          </h3>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Time</Table.Head>
                <Table.Head>$/Use</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {result.timeline.map((row) => (
                <Table.Row key={row.years}>
                  <Table.Cell>
                    {row.years} year{row.years !== 1 ? "s" : ""}
                  </Table.Cell>
                  <Table.Cell>
                    <span className={`font-semibold cost-${costClass(row.costPerUse)}`}>
                      {formatMoney(row.costPerUse)}
                    </span>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </>
      )}
    </div>
  );
}
