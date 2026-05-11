import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, schema } from "@/db/client";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await db
    .delete(schema.foodEntries)
    .where(and(eq(schema.foodEntries.id, params.id), eq(schema.foodEntries.userId, session.user.id)));
  return NextResponse.json({ ok: true });
}
