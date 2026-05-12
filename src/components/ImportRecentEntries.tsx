"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { FoodEntry } from "@/db/schema";
import { entryNutrients, round } from "@/lib/nutrition";
import { prettyDate } from "@/lib/date";

type Day = { date: string; entries: FoodEntry[] };

type Props = {
  date: string;
  onImported: (entries: FoodEntry[]) => void;
};

export function ImportRecentEntries({ date, onImported }: Props) {
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/entries/recent?before=${date}`);
        if (!res.ok) {
          if (!cancelled) {
            setDays([]);
            setError("Couldn't load recent entries.");
          }
          return;
        }
        const data = (await res.json()) as { days: Day[] };
        if (!cancelled) setDays(data.days);
      } catch {
        if (!cancelled) setError("Network error.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/entries/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, ids: [...selected] }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Could not import entries");
        return;
      }
      const data = (await res.json()) as { entries: FoodEntry[] };
      onImported(data.entries);
      setSelected(new Set());
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted">Loading recent entries…</p>;
  }

  if (days.length === 0) {
    return <p className="text-sm text-muted">No entries in the previous 7 days yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
        {days.map((day) => (
          <li key={day.date}>
            <div className="text-xs text-muted mb-1">{prettyDate(day.date)}</div>
            <ul className="flex flex-col gap-1">
              {day.entries.map((e) => {
                const n = entryNutrients(e);
                const checked = selected.has(e.id);
                return (
                  <li key={e.id}>
                    <label
                      className={`flex items-start gap-3 bg-panel2 hover:bg-border border rounded-lg p-3 cursor-pointer transition-colors ${
                        checked ? "border-[#7cc4ff]" : "border-border"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 w-auto"
                        checked={checked}
                        onChange={() => toggle(e.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{e.description}</div>
                        <div className="text-xs text-muted">
                          {round(e.grams)} g · {round(n.kcal)} kcal · P {round(n.protein, 1)} · C{" "}
                          {round(n.carbs, 1)} · F {round(n.fat, 1)}
                        </div>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
      {error && <p className="text-danger text-sm">{error}</p>}
      <button
        type="button"
        className="btn-primary"
        onClick={submit}
        disabled={selected.size === 0 || submitting}
      >
        <Plus size={16} className="inline mr-1" />
        {submitting
          ? "Importing…"
          : selected.size === 0
            ? "Select entries to import"
            : `Import ${selected.size} item${selected.size === 1 ? "" : "s"}`}
      </button>
    </div>
  );
}
