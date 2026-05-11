"use client";

import type { Totals } from "@/lib/nutrition";
import { round } from "@/lib/nutrition";

export function TotalsCard({ totals }: { totals: Totals }) {
  const items: Array<[string, string]> = [
    ["Calories", `${round(totals.kcal)} kcal`],
    ["Protein", `${round(totals.protein, 1)} g`],
    ["Carbs", `${round(totals.carbs, 1)} g`],
    ["Fat", `${round(totals.fat, 1)} g`],
    ["Fiber", `${round(totals.fiber, 1)} g`],
  ];
  return (
    <div className="card">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {items.map(([label, value]) => (
          <div key={label}>
            <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
            <div className="text-lg font-semibold">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
