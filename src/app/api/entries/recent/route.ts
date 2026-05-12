import { NextResponse } from "next/server";
import { z } from "zod";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { SINGLE_USER_ID } from "@/lib/user";
import { addDays } from "@/lib/date";
import type { FoodEntry } from "@/db/schema";

const DateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const before = searchParams.get("before");
  if (!before || !DateStr.safeParse(before).success) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const start = addDays(before, -7);
  const end = addDays(before, -1);

  const rows = await db
    .select()
    .from(schema.foodEntries)
    .where(
      and(
        eq(schema.foodEntries.userId, SINGLE_USER_ID),
        gte(schema.foodEntries.date, start),
        lte(schema.foodEntries.date, end),
      ),
    )
    .orderBy(desc(schema.foodEntries.date), asc(schema.foodEntries.createdAt));

  const days: { date: string; entries: FoodEntry[] }[] = [];
  for (const row of rows) {
    const last = days[days.length - 1];
    if (last && last.date === row.date) {
      last.entries.push(row);
    } else {
      days.push({ date: row.date, entries: [row] });
    }
  }

  return NextResponse.json({ days });
}
