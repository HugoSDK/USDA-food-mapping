"use client";

import { useEffect, useState } from "react";
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

  return (
    <main className="max-w-2xl mx-auto p-4 flex flex-col gap-4">
      <MonthCalendar selected={date} />
      <DateNav date={date} />
      <TotalsCard totals={totals} />
      <AddFoodForm date={date} onAdded={onAdded} onImported={onImported} />
      {error && <div className="card text-sm text-danger">{error}</div>}
      {loading ? (
        <div className="card text-sm text-muted">Loading…</div>
      ) : (
        <EntryList entries={entries} onDelete={onDelete} onUpdate={onUpdate} />
      )}
      <WeightTracker date={date} />
    </main>
  );
}
