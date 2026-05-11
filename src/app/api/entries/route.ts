import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { SINGLE_USER_ID } from "@/lib/user";

const DateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const PostBody = z.object({
  date: DateStr,
  description: z.string().trim().min(1).max(200),
  grams: z.number().positive().max(10000),
  fdcId: z.number().int(),
  foodName: z.string().trim().min(1).max(200),
  kcalPer100g: z.number().min(0).max(2000),
  proteinPer100g: z.number().min(0).max(200),
  carbsPer100g: z.number().min(0).max(200),
  fatPer100g: z.number().min(0).max(200),
  fiberPer100g: z.number().min(0).max(200).default(0),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date || !DateStr.safeParse(date).success) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  const rows = await db
    .select()
    .from(schema.foodEntries)
    .where(and(eq(schema.foodEntries.userId, SINGLE_USER_ID), eq(schema.foodEntries.date, date)))
    .orderBy(asc(schema.foodEntries.createdAt));
  return NextResponse.json({ entries: rows });
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = PostBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid entry" }, { status: 400 });
  }
  const id = randomUUID();
  await db.insert(schema.foodEntries).values({
    id,
    userId: SINGLE_USER_ID,
    ...parsed.data,
  });
  const [row] = await db
    .select()
    .from(schema.foodEntries)
    .where(eq(schema.foodEntries.id, id));
  return NextResponse.json({ entry: row });
}
