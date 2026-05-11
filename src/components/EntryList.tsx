"use client";

import type { FoodEntry } from "@/db/schema";
import { entryNutrients, round } from "@/lib/nutrition";
import { Trash2 } from "lucide-react";

type Props = {
  entries: FoodEntry[];
  onDelete: (id: string) => void;
};

export function EntryList({ entries, onDelete }: Props) {
  if (entries.length === 0) {
    return (
      <div className="card text-sm text-muted">
        No entries yet for this day. Add a food above to get started.
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {entries.map((e) => {
        const n = entryNutrients(e);
        return (
          <li key={e.id} className="card flex justify-between gap-3 items-start">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{e.description}</div>
              <div className="text-xs text-muted truncate">
                {e.foodName} · {round(e.grams)} g
              </div>
              <div className="text-xs text-muted mt-1">
                P {round(n.protein, 1)} g · C {round(n.carbs, 1)} g · F {round(n.fat, 1)} g
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-medium">{round(n.kcal)} kcal</div>
              <button
                type="button"
                aria-label="Delete entry"
                className="btn-ghost mt-1 text-muted hover:text-danger"
                onClick={() => onDelete(e.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
