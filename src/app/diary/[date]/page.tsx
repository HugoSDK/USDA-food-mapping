import { DiaryView } from "@/components/DiaryView";
import { isValidDateStr } from "@/lib/date";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DiaryByDate({ params }: { params: { date: string } }) {
  if (!isValidDateStr(params.date)) notFound();
  return <DiaryView date={params.date} />;
}
