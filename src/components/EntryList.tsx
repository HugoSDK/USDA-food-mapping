"use client";

import { useState } from "react";
import type { FoodEntry } from "@/db/schema";
import { entryNutrients, round } from "@/lib/nutrition";
import { Check, Pencil, Trash2, X } from "lucide-react";

type Props = {
  entries: FoodEntry[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, grams: number) => void;
};

export function EntryList({ entries, onDelete, onUpdate }: Props) {
  if (entries.length === 0) {
    return (
      <div className="card text-sm text-muted">
        No entries yet for this day. Add a food above to get started.
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {entries.map((e) => (
        <EntryRow key={e.id} entry={e} onDelete={onDelete} onUpdate={onUpdate} />
      ))}
    </ul>
  );
}

function EntryRow({
  entry,
  onDelete,
  onUpdate,
}: {
  entry: FoodEntry;
  onDelete: (id: string) => void;
  onUpdate: (id: string, grams: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(String(entry.grams));

  const draftGrams = Number(draft);
  const previewGrams = editing && Number.isFinite(draftGrams) && draftGrams > 0 ? draftGrams : entry.grams;
  const n = entryNutrients({ ...entry, grams: previewGrams });

  const startEdit = () => {
    setDraft(String(entry.grams));
    setEditing(true);
  };

  const save = () => {
    if (!Number.isFinite(draftGrams) || draftGrams <= 0) return;
    if (draftGrams !== entry.grams) onUpdate(entry.id, draftGrams);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(String(entry.grams));
    setEditing(false);
  };

  return (
    <li className="card flex justify-between gap-3 items-start">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{entry.description}</div>
        {editing ? (
          <div className="text-xs text-muted mt-1 flex items-center gap-2">
            <span className="truncate">{entry.foodName} ·</span>
            <input
              type="number"
              inputMode="decimal"
              min="1"
              step="1"
              value={draft}
              onChange={(ev) => setDraft(ev.target.value)}
              onKeyDown={(ev) => {
                if (ev.key === "Enter") save();
                else if (ev.key === "Escape") cancel();
              }}
              className="w-20"
              autoFocus
            />
            <span>g</span>
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
        ) : (
          <div className="text-xs text-muted truncate">
            {entry.foodName} · {round(entry.grams)} g
          </div>
        )}
        <div className="text-xs text-muted mt-1">
          P {round(n.protein, 1)} g · C {round(n.carbs, 1)} g · F {round(n.fat, 1)} g
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-medium">{round(n.kcal)} kcal</div>
        <div className="mt-1 flex justify-end gap-1">
          {!editing && (
            <button
              type="button"
              aria-label="Edit weight"
              className="btn-ghost text-muted hover:text-accent"
              onClick={startEdit}
            >
              <Pencil size={16} />
            </button>
          )}
          <button
            type="button"
            aria-label="Delete entry"
            className="btn-ghost text-muted hover:text-danger"
            onClick={() => onDelete(entry.id)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </li>
  );
}
