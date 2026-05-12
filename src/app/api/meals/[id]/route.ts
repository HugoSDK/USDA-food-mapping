import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { SINGLE_USER_ID } from "@/lib/user";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const deleted = await db
    .delete(schema.meals)
    .where(and(eq(schema.meals.id, params.id), eq(schema.meals.userId, SINGLE_USER_ID)))
    .returning({ id: schema.meals.id });
  if (deleted.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
