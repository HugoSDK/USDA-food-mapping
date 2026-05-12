"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { FoodEntry } from "@/db/schema";
import { round } from "@/lib/nutrition";

type MealSummary = {
  id: string;
  name: string;
  itemCount: number;
  kcal: number;
};

type Props = {
  date: string;
  mealsVersion: number;
  onStartCreateMeal: () => void;
  onMealImported: (entries: FoodEntry[]) => void;
};

export function MealsTab({ date, mealsVersion, onStartCreateMeal, onMealImported }: Props) {
  const [meals, setMeals] = useState<MealSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/meals");
        if (!res.ok) {
          if (!cancelled) {
            setMeals([]);
            setError("Couldn't load meals.");
          }
          return;
        }
        const data = (await res.json()) as { meals: MealSummary[] };
        if (!cancelled) setMeals(data.meals);
      } catch {
        if (!cancelled) setError("Network error.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mealsVersion]);

  const importMeal = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/meals/${id}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Could not import meal");
        return;
      }
      const data = (await res.json()) as { entries: FoodEntry[] };
      onMealImported(data.entries);
    } catch {
      setError("Network error.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteMeal = async (id: string) => {
    const prev = meals;
    setMeals((cur) => cur.filter((m) => m.id !== id));
    setError(null);
    const res = await fetch(`/api/meals/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setMeals(prev);
      setError("Couldn't delete meal.");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <button type="button" className="btn-secondary self-start" onClick={onStartCreateMeal}>
        <Plus size={16} className="inline mr-1" />
        Create new meal
      </button>

      {loading ? (
        <p className="text-sm text-muted">Loading meals…</p>
      ) : meals.length === 0 ? (
        <p className="text-sm text-muted">
          No saved meals yet. Tick entries on the diary and save them as a meal to reuse later.
        </p>
      ) : (
        <ul className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
          {meals.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 bg-panel2 border border-border rounded-lg p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{m.name}</div>
                <div className="text-xs text-muted">
                  {m.itemCount} item{m.itemCount === 1 ? "" : "s"} · {round(m.kcal)} kcal
                </div>
              </div>
              <button
                type="button"
                className="btn-primary text-sm px-3 py-1.5"
                onClick={() => importMeal(m.id)}
                disabled={busyId === m.id}
              >
                {busyId === m.id ? "Importing…" : "Import"}
              </button>
              <button
                type="button"
                aria-label="Delete meal"
                className="btn-ghost text-muted hover:text-danger"
                onClick={() => deleteMeal(m.id)}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-danger text-sm">{error}</p>}
    </div>
  );
}
