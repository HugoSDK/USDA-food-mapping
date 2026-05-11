import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().trim().min(1).max(80).optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password (min 8 chars)" }, { status: 400 });
  }
  const email = parsed.data.email.trim().toLowerCase();
  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await db.insert(schema.users).values({
    id: randomUUID(),
    email,
    passwordHash,
    name: parsed.data.name ?? null,
  });
  return NextResponse.json({ ok: true });
}
