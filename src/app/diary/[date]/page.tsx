import { auth } from "@/auth";
import { DiaryView } from "@/components/DiaryView";
import { isValidDateStr } from "@/lib/date";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DiaryByDate({ params }: { params: { date: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!isValidDateStr(params.date)) notFound();
  return <DiaryView date={params.date} userName={session.user.name ?? session.user.email} />;
}
