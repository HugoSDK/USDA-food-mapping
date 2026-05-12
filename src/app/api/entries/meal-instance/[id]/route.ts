import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { SINGLE_USER_ID } from "@/lib/user";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const deleted = await db
    .delete(schema.foodEntries)
    .where(
      and(
        eq(schema.foodEntries.userId, SINGLE_USER_ID),
        eq(schema.foodEntries.mealInstanceId, params.id),
      ),
    )
    .returning({ id: schema.foodEntries.id });
  if (deleted.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, deletedIds: deleted.map((r) => r.id) });
}
