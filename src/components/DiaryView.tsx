"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import type { FoodEntry } from "@/db/schema";
import { AddFoodForm } from "./AddFoodForm";
import { EntryList } from "./EntryList";
import { TotalsCard } from "./TotalsCard";
import { WeightTracker } from "./WeightTracker";
import { DateNav } from "./DateNav";
import { MonthCalendar } from "./MonthCalendar";
import { entryNutrients, sumTotals, ZERO_TOTALS } from "@/lib/nutrition";

type Props = {
  date: string;
};

export function DiaryView({ date }: Props) {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creatingMeal, setCreatingMeal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mealName, setMealName] = useState("");
  const [savingMeal, setSavingMeal] = useState(false);
  const [mealError, setMealError] = useState<string | null>(null);
  const [mealsVersion, setMealsVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/entries?date=${date}`);
      if (!res.ok) {
        if (!cancelled) {
          setEntries([]);
          setLoading(false);
        }
        return;
      }
      const data = (await res.json()) as { entries: FoodEntry[] };
      if (!cancelled) {
        setEntries(data.entries);
        setLoading(false);
      }
    })();
    // Reset any in-flight meal creation when the user navigates to a new day.
    setCreatingMeal(false);
    setSelectedIds(new Set());
    setMealName("");
    setMealError(null);
    return () => {
      cancelled = true;
    };
  }, [date]);

  const totals = entries.length === 0 ? ZERO_TOTALS : sumTotals(entries.map(entryNutrients));

  const onAdded = (entry: FoodEntry) => setEntries((prev) => [...prev, entry]);

  const onImported = (newEntries: FoodEntry[]) =>
    setEntries((prev) => [...prev, ...newEntries]);

  const onDelete = async (id: string) => {
    const prev = entries;
    setEntries((cur) => cur.filter((e) => e.id !== id));
    const res = await fetch(`/api/entries/${id}`, { method: "DELETE" });
    if (!res.ok) {
      console.error("Delete failed", res.status, await res.text().catch(() => ""));
      setEntries(prev);
      setError("Couldn't delete entry. Try again.");
      return;
    }
    setError(null);
  };

  const onDeleteMeal = async (mealInstanceId: string) => {
    const prev = entries;
    setEntries((cur) => cur.filter((e) => e.mealInstanceId !== mealInstanceId));
    const res = await fetch(`/api/entries/meal-instance/${mealInstanceId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      console.error("Delete meal failed", res.status, await res.text().catch(() => ""));
      setEntries(prev);
      setError("Couldn't delete meal. Try again.");
      return;
    }
    setError(null);
  };

  const onUpdate = async (id: string, grams: number) => {
    const prev = entries;
    setEntries((cur) => cur.map((e) => (e.id === id ? { ...e, grams } : e)));
    const res = await fetch(`/api/entries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grams }),
    });
    if (!res.ok) {
      console.error("Update failed", res.status, await res.text().catch(() => ""));
      setEntries(prev);
      setError("Couldn't update entry. Try again.");
      return;
    }
    setError(null);
  };

  const onToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startCreateMeal = () => {
    setMealError(null);
    setSelectedIds(new Set());
    setMealName("");
    setCreatingMeal(true);
  };

  const cancelCreateMeal = () => {
    setCreatingMeal(false);
    setSelectedIds(new Set());
    setMealName("");
    setMealError(null);
  };

  const saveMeal = async () => {
    const trimmed = mealName.trim();
    if (trimmed.length === 0) {
      setMealError("Give the meal a name.");
      return;
    }
    if (selectedIds.size === 0) {
      setMealError("Pick at least one entry.");
      return;
    }
    setSavingMeal(true);
    setMealError(null);
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, entryIds: [...selectedIds] }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setMealError(body.error ?? "Could not save meal");
        return;
      }
      setCreatingMeal(false);
      setSelectedIds(new Set());
      setMealName("");
      setMealsVersion((v) => v + 1);
    } catch {
      setMealError("Network error.");
    } finally {
      setSavingMeal(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-4 flex flex-col gap-4">
      <MonthCalendar selected={date} />
      <DateNav date={date} />
      <TotalsCard totals={totals} />
      <AddFoodForm
        date={date}
        onAdded={onAdded}
        onImported={onImported}
        mealsVersion={mealsVersion}
        onStartCreateMeal={startCreateMeal}
        onMealImported={onImported}
      />
      {error && <div className="card text-sm text-danger">{error}</div>}
      {creatingMeal && (
        <div className="card flex flex-col gap-2 border-accent/50 sticky top-2 z-10">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-medium">New meal</div>
            <div className="text-xs text-muted">
              {selectedIds.size} selected
            </div>
          </div>
          <input
            placeholder="Meal name (e.g. Breakfast)"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            maxLength={80}
            autoFocus
          />
          {mealError && <p className="text-danger text-sm">{mealError}</p>}
          <div className="flex justify-between gap-2">
            <button
              type="button"
              className="btn-ghost"
              onClick={cancelCreateMeal}
              disabled={savingMeal}
            >
              <X size={16} className="inline mr-1" />
              cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={saveMeal}
              disabled={savingMeal || selectedIds.size === 0 || mealName.trim().length === 0}
            >
              <Check size={16} className="inline mr-1" />
              {savingMeal ? "Saving…" : "Save meal"}
            </button>
          </div>
        </div>
      )}
      {loading ? (
        <div className="card text-sm text-muted">Loading…</div>
      ) : (
        <EntryList
          entries={entries}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onDeleteMeal={onDeleteMeal}
          selectionMode={creatingMeal}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
        />
      )}
      <WeightTracker date={date} />
    </main>
  );
}
