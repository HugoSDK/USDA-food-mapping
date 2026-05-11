"use client";

import { useEffect, useState } from "react";
import type { FoodEntry } from "@/db/schema";
import { AddFoodForm } from "./AddFoodForm";
import { EntryList } from "./EntryList";
import { TotalsCard } from "./TotalsCard";
import { WeightTracker } from "./WeightTracker";
import { DateNav } from "./DateNav";
import { entryNutrients, sumTotals, ZERO_TOTALS } from "@/lib/nutrition";

type Props = {
  date: string;
  userName?: string | null;
};

export function DiaryView({ date, userName }: Props) {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

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

  const onDelete = async (id: string) => {
    const prev = entries;
    setEntries((cur) => cur.filter((e) => e.id !== id));
    const res = await fetch(`/api/entries/${id}`, { method: "DELETE" });
    if (!res.ok) setEntries(prev);
  };

  return (
    <main className="max-w-2xl mx-auto p-4 flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Food diary</h1>
        <form action="/api/auth/signout" method="post">
          <button type="submit" className="btn-ghost text-xs">
            {userName ? `${userName} · sign out` : "Sign out"}
          </button>
        </form>
      </header>
      <DateNav date={date} />
      <TotalsCard totals={totals} />
      <AddFoodForm date={date} onAdded={onAdded} />
      {loading ? (
        <div className="card text-sm text-muted">Loading…</div>
      ) : (
        <EntryList entries={entries} onDelete={onDelete} />
      )}
      <WeightTracker date={date} />
    </main>
  );
}
