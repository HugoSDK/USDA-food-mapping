import { NextResponse } from "next/server";
import { searchFoods } from "@/lib/usda";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ matches: [] });
  }
  try {
    const matches = await searchFoods(q);
    return NextResponse.json({ matches });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
