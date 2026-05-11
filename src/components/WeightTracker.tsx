"use client";

import { useEffect, useState } from "react";
import { addDays, prettyDate } from "@/lib/date";
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

  // Build a continuous list of days for the X-axis so gaps render as gaps.
  const days: Array<{ date: string; kg: number | null; label: string }> = [];
  const byDate = new Map(series.map((s) => [s.date, s.kg]));
  for (let i = RANGE_DAYS - 1; i >= 0; i--) {
    const d = addDays(date, -i);
    days.push({
      date: d,
      kg: byDate.get(d) ?? null,
      label: d.slice(5),
    });
  }
  const validKgs = series.map((s) => s.kg);
  const minY = validKgs.length ? Math.min(...validKgs) - 1 : 0;
  const maxY = validKgs.length ? Math.max(...validKgs) + 1 : 1;

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Weight</h2>
        <span className="text-xs text-muted">last {RANGE_DAYS} days</span>
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
    </div>
  );
}
