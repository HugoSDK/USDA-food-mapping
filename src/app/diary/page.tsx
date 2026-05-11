import { auth } from "@/auth";
import { DiaryView } from "@/components/DiaryView";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

// Get today's date from the client. Since this is a server component, we use a hint
// header. If absent, fall back to server-local today; the client will redirect to its
// local date on first render.
function serverToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function DiaryToday() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  // server's idea of today; for personal use this is fine, and the URL stays clean.
  // If timezones become an issue we can switch to a client-side redirect on /diary.
  void headers();
  return <DiaryView date={serverToday()} userName={session.user.name ?? session.user.email} />;
}
