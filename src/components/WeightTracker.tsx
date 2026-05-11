"use client";

import { useEffect, useState } from "react";
import { addDays, prettyDate } from "@/lib/date";
import { Check, Pencil, Trash2, X } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type WeightRow = { id: string; date: string; kg: number };

type Props = {
  date: string;
};

const RANGE_DAYS = 30;

export function WeightTracker({ date }: Props) {
  const [series, setSeries] = useState<WeightRow[]>([]);
  const [todaysKg, setTodaysKg] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const from = addDays(date, -(RANGE_DAYS - 1));
    const to = date;
    const res = await fetch(`/api/weight?from=${from}&to=${to}`);
    if (!res.ok) return;
    const data = (await res.json()) as { entries: WeightRow[] };
    setSeries(data.entries);
    const todays = data.entries.find((e) => e.date === date);
    setTodaysKg(todays ? String(todays.kg) : "");
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const kg = Number(todaysKg);
    if (!Number.isFinite(kg) || kg <= 0) {
      setError("Enter a valid weight");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, kg }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Could not save weight");
      return;
    }
    refresh();
  };

  const updateRow = async (rowDate: string, kg: number) => {
    const res = await fetch("/api/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: rowDate, kg }),
    });
    if (res.ok) refresh();
  };

  const deleteRow = async (id: string) => {
    const res = await fetch(`/api/weight/${id}`, { method: "DELETE" });
    if (res.ok) refresh();
  };

  // Chart spans from the earliest entry (or today) through today, capped at
  // RANGE_DAYS. This keeps the X-axis tight to actual data rather than padding
  // with empty dates back to today - 30.
  const sortedDates = series.map((s) => s.date).sort();
  const earliestEntry = sortedDates[0] ?? date;
  const startDate = earliestEntry < date ? earliestEntry : date;
  const cappedStart = (() => {
    const cap = addDays(date, -(RANGE_DAYS - 1));
    return startDate < cap ? cap : startDate;
  })();
  const days: Array<{ date: string; kg: number | null; label: string }> = [];
  const byDate = new Map(series.map((s) => [s.date, s.kg]));
  let cur = cappedStart;
  while (cur <= date) {
    days.push({ date: cur, kg: byDate.get(cur) ?? null, label: cur.slice(5) });
    cur = addDays(cur, 1);
  }
  const visibleKgs = days
    .map((d) => d.kg)
    .filter((k): k is number => k != null);
  const minY = visibleKgs.length ? Math.min(...visibleKgs) - 1 : 0;
  const maxY = visibleKgs.length ? Math.max(...visibleKgs) + 1 : 1;
  const recent = [...series].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Weight</h2>
        <span className="text-xs text-muted">
          {days.length > 1 ? `${days.length} days` : "today"}
        </span>
      </div>
      <form onSubmit={save} className="flex gap-2 items-end mb-3">
        <div className="flex-1">
          <label className="block text-xs text-muted mb-1">Today's weight (kg)</label>
          <input
            type="number"
            inputMode="decimal"
            min="1"
            step="0.1"
            placeholder="e.g. 72.4"
            value={todaysKg}
            onChange={(e) => setTodaysKg(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
      {error && <p className="text-danger text-sm mb-2">{error}</p>}
      <div style={{ width: "100%", height: 160 }}>
        <ResponsiveContainer>
          <LineChart data={days} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="#272c33" strokeDasharray="2 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#8b939e", fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis
              domain={[minY, maxY]}
              tick={{ fill: "#8b939e", fontSize: 11 }}
              width={40}
              allowDecimals
            />
            <Tooltip
              contentStyle={{ background: "#15181d", border: "1px solid #272c33", borderRadius: 8 }}
              labelStyle={{ color: "#e6e8eb" }}
              labelFormatter={(label, payload) => {
                const item = payload?.[0]?.payload as { date: string } | undefined;
                return item ? prettyDate(item.date) : String(label);
              }}
              formatter={(v: number | string) => [`${v} kg`, "Weight"]}
            />
            <Line
              type="monotone"
              dataKey="kg"
              stroke="#7cc4ff"
              strokeWidth={2}
              dot={{ r: 3, fill: "#7cc4ff" }}
              connectNulls
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {recent.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <div className="text-xs text-muted mb-2">Recent entries</div>
          <ul className="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1">
            {recent.map((row) => (
              <WeightRowItem key={row.id} row={row} onUpdate={updateRow} onDelete={deleteRow} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function WeightRowItem({
  row,
  onUpdate,
  onDelete,
}: {
  row: WeightRow;
  onUpdate: (date: string, kg: number) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(String(row.kg));

  const startEdit = () => {
    setDraft(String(row.kg));
    setEditing(true);
  };

  const save = () => {
    const kg = Number(draft);
    if (!Number.isFinite(kg) || kg <= 0) return;
    if (kg !== row.kg) onUpdate(row.date, kg);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(String(row.kg));
    setEditing(false);
  };

  return (
    <li className="flex items-center justify-between gap-2 py-1 text-sm">
      <span className="text-muted shrink-0 w-24">{prettyDate(row.date)}</span>
      {editing ? (
        <>
          <input
            type="number"
            inputMode="decimal"
            min="0.1"
            step="0.1"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              else if (e.key === "Escape") cancel();
            }}
            className="w-24"
            autoFocus
          />
          <span className="text-muted shrink-0">kg</span>
          <div className="flex gap-1 ml-auto">
            <button
              type="button"
              aria-label="Save weight"
              className="btn-ghost text-muted hover:text-accent"
              onClick={save}
            >
              <Check size={16} />
            </button>
            <button
              type="button"
              aria-label="Cancel edit"
              className="btn-ghost text-muted hover:text-danger"
              onClick={cancel}
            >
              <X size={16} />
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="font-medium">{row.kg} kg</span>
          <div className="flex gap-1 ml-auto">
            <button
              type="button"
              aria-label="Edit weight"
              className="btn-ghost text-muted hover:text-accent"
              onClick={startEdit}
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              aria-label="Delete weight entry"
              className="btn-ghost text-muted hover:text-danger"
              onClick={() => onDelete(row.id)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </>
      )}
    </li>
  );
}
