"use client";

import { useEffect, useRef, useState } from "react";
import type { FoodEntry } from "@/db/schema";
import { round } from "@/lib/nutrition";

type Match = {
  fdcId: number;
  description: string;
  dataType: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
};

type Props = {
  date: string;
  onAdded: (entry: FoodEntry) => void;
};

export function AddFoodForm({ date, onAdded }: Props) {
  const [query, setQuery] = useState("");
  const [grams, setGrams] = useState<string>("100");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setMatches([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/foods/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) {
          setError("Search failed");
          setMatches([]);
          return;
        }
        const data = await res.json();
        setMatches(data.matches ?? []);
        setError(null);
        setOpen(true);
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const pick = async (m: Match) => {
    const g = Number(grams);
    if (!Number.isFinite(g) || g <= 0) {
      setError("Enter a weight in grams");
      return;
    }
    setError(null);
    setOpen(false);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          description: query.trim(),
          grams: g,
          fdcId: m.fdcId,
          foodName: m.description,
          kcalPer100g: m.kcalPer100g,
          proteinPer100g: m.proteinPer100g,
          carbsPer100g: m.carbsPer100g,
          fatPer100g: m.fatPer100g,
          fiberPer100g: m.fiberPer100g,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Could not save entry");
        return;
      }
      const data = await res.json();
      onAdded(data.entry as FoodEntry);
      setQuery("");
      setMatches([]);
    } catch {
      setError("Network error");
    }
  };

  return (
    <div className="card" ref={containerRef}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="block text-xs text-muted mb-1">Food</label>
          <input
            placeholder="e.g. chicken breast, raw"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => matches.length > 0 && setOpen(true)}
          />
        </div>
        <div className="w-full sm:w-32">
          <label className="block text-xs text-muted mb-1">Weight (g)</label>
          <input
            type="number"
            inputMode="decimal"
            min="1"
            step="1"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
          />
        </div>
      </div>
      {loading && <p className="text-xs text-muted mt-2">Searching USDA…</p>}
      {error && <p className="text-danger text-sm mt-2">{error}</p>}
      {open && matches.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1 border-t border-border pt-3">
          {matches.map((m) => {
            const g = Number(grams) || 0;
            const kcal = round((m.kcalPer100g * g) / 100);
            return (
              <li key={m.fdcId}>
                <button
                  type="button"
                  onClick={() => pick(m)}
                  className="w-full text-left bg-panel2 hover:bg-border border border-border rounded-lg p-3 transition-colors"
                >
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm truncate">{m.description}</div>
                      <div className="text-xs text-muted">
                        {Math.round(m.kcalPer100g)} kcal / 100g · P {round(m.proteinPer100g, 1)} · C{" "}
                        {round(m.carbsPer100g, 1)} · F {round(m.fatPer100g, 1)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-medium">{kcal} kcal</div>
                      <div className="text-xs text-muted">for {g || 0} g</div>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {open && !loading && query.trim().length >= 2 && matches.length === 0 && (
        <p className="text-sm text-muted mt-3">No matches. Try a simpler term (e.g. "chicken breast" not "spicy grilled chicken").</p>
      )}
    </div>
  );
}
