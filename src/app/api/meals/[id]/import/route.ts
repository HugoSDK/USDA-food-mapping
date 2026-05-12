import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { SINGLE_USER_ID } from "@/lib/user";

const DateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const PostBody = z.object({
  date: DateStr,
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const json = await req.json().catch(() => null);
  const parsed = PostBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid import request" }, { status: 400 });
  }
  const { date } = parsed.data;

  const [meal] = await db
    .select()
    .from(schema.meals)
    .where(
      and(
        eq(schema.meals.id, params.id),
        eq(schema.meals.userId, SINGLE_USER_ID),
      ),
    );
  if (!meal) {
    return NextResponse.json({ error: "Meal not found" }, { status: 404 });
  }

  const items = await db
    .select()
    .from(schema.mealItems)
    .where(eq(schema.mealItems.mealId, meal.id))
    .orderBy(asc(schema.mealItems.createdAt));

  if (items.length === 0) {
    return NextResponse.json({ entries: [] });
  }

  const mealInstanceId = randomUUID();
  const baseMs = Date.now();
  const newIds = items.map(() => randomUUID());
  // Offset createdAt per row so the meal's entries have a deterministic order
  // and stay contiguous when sorted by createdAt in GET /api/entries.
  const values = items.map((src, i) => ({
    id: newIds[i],
    userId: SINGLE_USER_ID,
    date,
    description: src.description,
    grams: src.grams,
    fdcId: src.fdcId,
    foodName: src.foodName,
    kcalPer100g: src.kcalPer100g,
    proteinPer100g: src.proteinPer100g,
    carbsPer100g: src.carbsPer100g,
    fatPer100g: src.fatPer100g,
    fiberPer100g: src.fiberPer100g,
    mealInstanceId,
    mealName: meal.name,
    createdAt: new Date(baseMs + i),
  }));

  await db.insert(schema.foodEntries).values(values);

  const rows = await db
    .select()
    .from(schema.foodEntries)
    .where(inArray(schema.foodEntries.id, newIds))
    .orderBy(asc(schema.foodEntries.createdAt));

  return NextResponse.json({ entries: rows });
}
