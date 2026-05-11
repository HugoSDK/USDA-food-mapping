// USDA FoodData Central API client
// Docs: https://fdc.nal.usda.gov/api-guide.html

const BASE = "https://api.nal.usda.gov/fdc/v1";

// Nutrient numbers used by FDC
const N = {
  ENERGY_KCAL: "1008",
  ENERGY_KCAL_ATWATER: "2047", // some Foundation entries use this
  ENERGY_KCAL_ATWATER_GENERAL: "2048",
  PROTEIN: "1003",
  CARBS: "1005",
  FAT: "1004",
  FIBER: "1079",
} as const;

export type FoodMatch = {
  fdcId: number;
  description: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  dataType: string;
};

type FdcFoodNutrient = {
  nutrientNumber?: string;
  nutrientName?: string;
  unitName?: string;
  value?: number;
};

type FdcFood = {
  fdcId: number;
  description: string;
  dataType: string;
  foodNutrients?: FdcFoodNutrient[];
};

type FdcSearchResponse = {
  foods?: FdcFood[];
};

const pickNutrient = (nutrients: FdcFoodNutrient[] | undefined, numbers: string[]): number => {
  if (!nutrients) return 0;
  for (const num of numbers) {
    const n = nutrients.find((x) => x.nutrientNumber === num);
    if (n && typeof n.value === "number") return n.value;
  }
  return 0;
};

const normalize = (food: FdcFood): FoodMatch => ({
  fdcId: food.fdcId,
  description: food.description,
  dataType: food.dataType,
  kcalPer100g: pickNutrient(food.foodNutrients, [
    N.ENERGY_KCAL,
    N.ENERGY_KCAL_ATWATER,
    N.ENERGY_KCAL_ATWATER_GENERAL,
  ]),
  proteinPer100g: pickNutrient(food.foodNutrients, [N.PROTEIN]),
  carbsPer100g: pickNutrient(food.foodNutrients, [N.CARBS]),
  fatPer100g: pickNutrient(food.foodNutrients, [N.FAT]),
  fiberPer100g: pickNutrient(food.foodNutrients, [N.FIBER]),
});

export async function searchFoods(query: string, limit = 5): Promise<FoodMatch[]> {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    throw new Error("USDA_API_KEY is not configured");
  }
  const q = query.trim();
  if (!q) return [];
  const url = new URL(`${BASE}/foods/search`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", q);
  url.searchParams.set("pageSize", String(Math.max(limit * 2, 10)));
  // Foundation, SR Legacy, FNDDS all give per-100g nutrient values.
  // We skip "Branded" by default (those are per-serving, more complex).
  url.searchParams.set("dataType", "Foundation,SR Legacy,Survey (FNDDS)");
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`USDA search failed: ${res.status}`);
  }
  const data = (await res.json()) as FdcSearchResponse;
  const matches = (data.foods ?? []).map(normalize).filter((m) => m.kcalPer100g > 0);
  // Light de-dup by description, then trim to limit
  const seen = new Set<string>();
  const out: FoodMatch[] = [];
  for (const m of matches) {
    const key = m.description.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
    if (out.length >= limit) break;
  }
  return out;
}
