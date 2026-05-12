import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, gte, lte } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { SINGLE_USER_ID } from "@/lib/user";

const DateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to || !DateStr.safeParse(from).success || !DateStr.safeParse(to).success) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  const rows = await db
    .selectDistinct({ date: schema.foodEntries.date })
    .from(schema.foodEntries)
    .where(
      and(
        eq(schema.foodEntries.userId, SINGLE_USER_ID),
        gte(schema.foodEntries.date, from),
        lte(schema.foodEntries.date, to),
      ),
    );

  return NextResponse.json({ dates: rows.map((r) => r.date) });
}
