import { DiaryView } from "@/components/DiaryView";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

function serverToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function DiaryToday() {
  void headers();
  return <DiaryView date={serverToday()} />;
}
