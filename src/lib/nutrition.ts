import type { FoodEntry } from "@/db/schema";

export type Totals = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

export const ZERO_TOTALS: Totals = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

export function entryNutrients(entry: Pick<FoodEntry,
  "grams" | "kcalPer100g" | "proteinPer100g" | "carbsPer100g" | "fatPer100g" | "fiberPer100g"
>): Totals {
  const f = entry.grams / 100;
  return {
    kcal: entry.kcalPer100g * f,
    protein: entry.proteinPer100g * f,
    carbs: entry.carbsPer100g * f,
    fat: entry.fatPer100g * f,
    fiber: entry.fiberPer100g * f,
  };
}

export function sumTotals(items: Totals[]): Totals {
  return items.reduce(
    (acc, t) => ({
      kcal: acc.kcal + t.kcal,
      protein: acc.protein + t.protein,
      carbs: acc.carbs + t.carbs,
      fat: acc.fat + t.fat,
      fiber: acc.fiber + t.fiber,
    }),
    ZERO_TOTALS,
  );
}

export function round(n: number, decimals = 0): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
