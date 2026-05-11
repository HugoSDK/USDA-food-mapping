import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { SINGLE_USER_ID } from "@/lib/user";

const PutBody = z.object({
  grams: z.number().positive().max(10000),
});

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const deleted = await db
    .delete(schema.foodEntries)
    .where(and(eq(schema.foodEntries.id, params.id), eq(schema.foodEntries.userId, SINGLE_USER_ID)))
    .returning({ id: schema.foodEntries.id });
  if (deleted.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const json = await req.json().catch(() => null);
  const parsed = PutBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid grams" }, { status: 400 });
  }
  const [row] = await db
    .update(schema.foodEntries)
    .set({ grams: parsed.data.grams })
    .where(and(eq(schema.foodEntries.id, params.id), eq(schema.foodEntries.userId, SINGLE_USER_ID)))
    .returning();
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ entry: row });
}
