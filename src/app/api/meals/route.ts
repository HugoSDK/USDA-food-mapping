import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { SINGLE_USER_ID } from "@/lib/user";

const PostBody = z.object({
  name: z.string().trim().min(1).max(80),
  entryIds: z.array(z.string().min(1)).min(1).max(50),
});

export async function GET() {
  const rows = await db
    .select()
    .from(schema.meals)
    .where(eq(schema.meals.userId, SINGLE_USER_ID))
    .orderBy(desc(schema.meals.createdAt));

  if (rows.length === 0) {
    return NextResponse.json({ meals: [] });
  }

  const mealIds = rows.map((m) => m.id);
  const items = await db
    .select()
    .from(schema.mealItems)
    .where(inArray(schema.mealItems.mealId, mealIds))
    .orderBy(asc(schema.mealItems.createdAt));

  const byMeal = new Map<string, typeof items>();
  for (const item of items) {
    const list = byMeal.get(item.mealId) ?? [];
    list.push(item);
    byMeal.set(item.mealId, list);
  }

  const meals = rows.map((m) => {
    const list = byMeal.get(m.id) ?? [];
    const kcal = list.reduce((sum, it) => sum + (it.grams * it.kcalPer100g) / 100, 0);
    return {
      id: m.id,
      name: m.name,
      createdAt: m.createdAt,
      itemCount: list.length,
      kcal,
    };
  });

  return NextResponse.json({ meals });
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = PostBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid meal" }, { status: 400 });
  }
  const { name, entryIds } = parsed.data;

  const sources = await db
    .select()
    .from(schema.foodEntries)
    .where(
      and(
        eq(schema.foodEntries.userId, SINGLE_USER_ID),
        inArray(schema.foodEntries.id, entryIds),
      ),
    );

  if (sources.length !== entryIds.length) {
    return NextResponse.json(
      { error: "Some entries could not be found" },
      { status: 400 },
    );
  }

  const mealId = randomUUID();
  try {
    await db.insert(schema.meals).values({
      id: mealId,
      userId: SINGLE_USER_ID,
      name,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("meals_user_name_uq")) {
      return NextResponse.json(
        { error: "A meal with that name already exists" },
        { status: 409 },
      );
    }
    throw err;
  }

  const itemValues = sources.map((src) => ({
    id: randomUUID(),
    mealId,
    description: src.description,
    grams: src.grams,
    fdcId: src.fdcId,
    foodName: src.foodName,
    kcalPer100g: src.kcalPer100g,
    proteinPer100g: src.proteinPer100g,
    carbsPer100g: src.carbsPer100g,
    fatPer100g: src.fatPer100g,
    fiberPer100g: src.fiberPer100g,
  }));

  await db.insert(schema.mealItems).values(itemValues);

  const kcal = itemValues.reduce(
    (sum, it) => sum + (it.grams * it.kcalPer100g) / 100,
    0,
  );

  return NextResponse.json({
    meal: {
      id: mealId,
      name,
      createdAt: new Date(),
      itemCount: itemValues.length,
      kcal,
    },
  });
}
