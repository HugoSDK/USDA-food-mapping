import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, schema } from "@/db/client";

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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date || !DateStr.safeParse(date).success) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  const rows = await db
    .select()
    .from(schema.foodEntries)
    .where(and(eq(schema.foodEntries.userId, session.user.id), eq(schema.foodEntries.date, date)))
    .orderBy(asc(schema.foodEntries.createdAt));
  return NextResponse.json({ entries: rows });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = PostBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid entry" }, { status: 400 });
  }
  const id = randomUUID();
  await db.insert(schema.foodEntries).values({
    id,
    userId: session.user.id,
    ...parsed.data,
  });
  const [row] = await db
    .select()
    .from(schema.foodEntries)
    .where(eq(schema.foodEntries.id, id));
  return NextResponse.json({ entry: row });
}
