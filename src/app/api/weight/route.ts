import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { SINGLE_USER_ID } from "@/lib/user";

const DateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const PostBody = z.object({
  date: DateStr,
  kg: z.number().positive().max(500),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to || !DateStr.safeParse(from).success || !DateStr.safeParse(to).success) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }
  const rows = await db
    .select()
    .from(schema.weightEntries)
    .where(
      and(
        eq(schema.weightEntries.userId, SINGLE_USER_ID),
        gte(schema.weightEntries.date, from),
        lte(schema.weightEntries.date, to),
      ),
    )
    .orderBy(asc(schema.weightEntries.date));
  return NextResponse.json({ entries: rows });
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = PostBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid weight" }, { status: 400 });
  }
  const existing = await db.query.weightEntries.findFirst({
    where: and(
      eq(schema.weightEntries.userId, SINGLE_USER_ID),
      eq(schema.weightEntries.date, parsed.data.date),
    ),
  });
  if (existing) {
    await db
      .update(schema.weightEntries)
      .set({ kg: parsed.data.kg })
      .where(eq(schema.weightEntries.id, existing.id));
    return NextResponse.json({ entry: { ...existing, kg: parsed.data.kg } });
  }
  const id = randomUUID();
  await db.insert(schema.weightEntries).values({
    id,
    userId: SINGLE_USER_ID,
    date: parsed.data.date,
    kg: parsed.data.kg,
  });
  const [row] = await db
    .select()
    .from(schema.weightEntries)
    .where(eq(schema.weightEntries.id, id));
  return NextResponse.json({ entry: row });
}
