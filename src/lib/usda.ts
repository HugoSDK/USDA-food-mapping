// USDA FoodData Central API client
// Docs: https://fdc.nal.usda.gov/api-guide.html

const BASE = "https://api.nal.usda.gov/fdc/v1";

// Nutrient numbers used by FDC. Foundation foods use the newer 4-digit codes
// (1008, 1003...). SR Legacy and Survey/FNDDS use the older 3-digit codes
// (208, 203...). pickNutrient tries each in order until it finds a match.
const ENERGY_NUMS = ["1008", "208", "2047", "2048"];
const PROTEIN_NUMS = ["1003", "203"];
const CARBS_NUMS = ["1005", "205"];
const FAT_NUMS = ["1004", "204"];
const FIBER_NUMS = ["1079", "291"];

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
  kcalPer100g: pickNutrient(food.foodNutrients, ENERGY_NUMS),
  proteinPer100g: pickNutrient(food.foodNutrients, PROTEIN_NUMS),
  carbsPer100g: pickNutrient(food.foodNutrients, CARBS_NUMS),
  fatPer100g: pickNutrient(food.foodNutrients, FAT_NUMS),
  fiberPer100g: pickNutrient(food.foodNutrients, FIBER_NUMS),
});

export async function searchFoods(query: string, limit = 50): Promise<FoodMatch[]> {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    throw new Error("USDA_API_KEY is not configured");
  }
  const q = query.trim();
  if (!q) return [];
  // POST variant: dataType as a JSON array. The GET variant trips nginx 400s
  // because URLSearchParams percent-encodes commas/parens in the dataType list.
  // Foundation, SR Legacy, FNDDS all give per-100g nutrient values.
  // We skip "Branded" by default (those are per-serving, more complex).
  const res = await fetch(`${BASE}/foods/search?api_key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: q,
      dataType: ["Foundation", "SR Legacy", "Survey (FNDDS)"],
      pageSize: Math.max(limit, 50),
    }),
    cache: "no-store",
  });
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
