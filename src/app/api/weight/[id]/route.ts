import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { SINGLE_USER_ID } from "@/lib/user";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await db
    .delete(schema.weightEntries)
    .where(and(eq(schema.weightEntries.id, params.id), eq(schema.weightEntries.userId, SINGLE_USER_ID)));
  return NextResponse.json({ ok: true });
}
