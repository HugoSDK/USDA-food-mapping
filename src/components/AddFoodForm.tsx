"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import type { FoodEntry } from "@/db/schema";
import { entryNutrients, round } from "@/lib/nutrition";
import { ImportRecentEntries } from "./ImportRecentEntries";
import { MealsTab } from "./MealsTab";

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

type Stage = { kind: "searching" } | { kind: "selected"; match: Match };
type Tab = "search" | "import" | "meals";

type Props = {
  date: string;
  onAdded: (entry: FoodEntry) => void;
  onImported: (entries: FoodEntry[]) => void;
  mealsVersion: number;
  onStartCreateMeal: () => void;
  onMealImported: (entries: FoodEntry[]) => void;
};

export function AddFoodForm({
  date,
  onAdded,
  onImported,
  mealsVersion,
  onStartCreateMeal,
  onMealImported,
}: Props) {
  const [tab, setTab] = useState<Tab>("search");
  const [query, setQuery] = useState("");
  const [grams, setGrams] = useState<string>("100");
  const [matches, setMatches] = useState<Match[]>([]);
  const [stage, setStage] = useState<Stage>({ kind: "searching" });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stage.kind !== "searching") return;
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
  }, [query, stage.kind]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const select = (m: Match) => {
    setError(null);
    setOpen(false);
    setStage({ kind: "selected", match: m });
  };

  const back = () => {
    setError(null);
    setStage({ kind: "searching" });
    if (matches.length > 0) setOpen(true);
  };

  const add = async () => {
    if (stage.kind !== "selected") return;
    const g = Number(grams);
    if (!Number.isFinite(g) || g <= 0) {
      setError("Enter a weight in grams");
      return;
    }
    const m = stage.match;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          description: query.trim() || m.description,
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
      setGrams("100");
      setStage({ kind: "searching" });
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const renderSearch = () => {
    if (stage.kind === "selected") {
      const m = stage.match;
      const g = Number(grams) || 0;
      const n = entryNutrients({
        grams: g,
        kcalPer100g: m.kcalPer100g,
        proteinPer100g: m.proteinPer100g,
        carbsPer100g: m.carbsPer100g,
        fatPer100g: m.fatPer100g,
        fiberPer100g: m.fiberPer100g,
      });
      return (
        <>
          <div className="text-sm font-medium">{m.description}</div>
          <div className="text-xs text-muted">
            {Math.round(m.kcalPer100g)} kcal / 100g · P {round(m.proteinPer100g, 1)} · C{" "}
            {round(m.carbsPer100g, 1)} · F {round(m.fatPer100g, 1)}
          </div>
          <div className="mt-3 w-full sm:w-32">
            <label className="block text-xs text-muted mb-1">Weight (g)</label>
            <input
              type="number"
              inputMode="decimal"
              min="1"
              step="1"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              autoFocus
            />
          </div>
          <div className="mt-2 text-sm">
            <span className="font-medium">{round(n.kcal)} kcal</span>
            <span className="text-muted">
              {" "}
              · P {round(n.protein, 1)} g · C {round(n.carbs, 1)} g · F {round(n.fat, 1)} g
            </span>
          </div>
          {error && <p className="text-danger text-sm mt-2">{error}</p>}
          <div className="mt-3 flex justify-between gap-2">
            <button type="button" className="btn-ghost" onClick={back} disabled={submitting}>
              <ArrowLeft size={16} className="inline mr-1" />
              back
            </button>
            <button type="button" className="btn-primary" onClick={add} disabled={submitting}>
              <Plus size={16} className="inline mr-1" />
              {submitting ? "Adding…" : "Add to diary"}
            </button>
          </div>
        </>
      );
    }

    return (
      <>
        <label className="block text-xs text-muted mb-1">Food</label>
        <input
          placeholder="e.g. chicken breast, raw"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => matches.length > 0 && setOpen(true)}
        />
        {loading && <p className="text-xs text-muted mt-2">Searching USDA…</p>}
        {error && <p className="text-danger text-sm mt-2">{error}</p>}
        {open && matches.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1 border-t border-border pt-3 max-h-96 overflow-y-auto pr-1">
            {matches.map((m) => (
              <li key={m.fdcId}>
                <button
                  type="button"
                  onClick={() => select(m)}
                  className="w-full text-left bg-panel2 hover:bg-border border border-border rounded-lg p-3 transition-colors"
                >
                  <div className="text-sm truncate">{m.description}</div>
                  <div className="text-xs text-muted">
                    {Math.round(m.kcalPer100g)} kcal / 100g · P {round(m.proteinPer100g, 1)} · C{" "}
                    {round(m.carbsPer100g, 1)} · F {round(m.fatPer100g, 1)}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {open && !loading && query.trim().length >= 2 && matches.length === 0 && (
          <p className="text-sm text-muted mt-3">No matches. Try a simpler term (e.g. "chicken breast" not "spicy grilled chicken").</p>
        )}
      </>
    );
  };

  return (
    <div className="card" ref={containerRef}>
      <div className="flex flex-wrap gap-1 mb-3 -mt-1">
        <button
          type="button"
          onClick={() => setTab("search")}
          className={`text-sm px-3 py-1.5 ${tab === "search" ? "btn-primary" : "btn-secondary"}`}
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => setTab("import")}
          className={`text-sm px-3 py-1.5 ${tab === "import" ? "btn-primary" : "btn-secondary"}`}
        >
          Import from recent
        </button>
        <button
          type="button"
          onClick={() => setTab("meals")}
          className={`text-sm px-3 py-1.5 ${tab === "meals" ? "btn-primary" : "btn-secondary"}`}
        >
          Meals
        </button>
      </div>
      {tab === "search" && renderSearch()}
      {tab === "import" && <ImportRecentEntries date={date} onImported={onImported} />}
      {tab === "meals" && (
        <MealsTab
          date={date}
          mealsVersion={mealsVersion}
          onStartCreateMeal={onStartCreateMeal}
          onMealImported={onMealImported}
        />
      )}
    </div>
  );
}
