"use client";

import Link from "next/link";
import { addDays, MIN_DATE, prettyDate, todayLocal } from "@/lib/date";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function DateNav({ date }: { date: string }) {
  const today = todayLocal();
  const prev = addDays(date, -1);
  const next = addDays(date, 1);
  const isToday = date === today;
  const isFutureNext = next > today;
  const isPastPrev = prev < MIN_DATE;

  return (
    <div className="flex items-center justify-between gap-2">
      <Link
        href={isPastPrev ? "#" : `/diary/${prev}`}
        className={`btn-secondary inline-flex items-center gap-1 ${isPastPrev ? "opacity-30 pointer-events-none" : ""}`}
        aria-label="Previous day"
        aria-disabled={isPastPrev}
      >
        <ChevronLeft size={16} /> Prev
      </Link>
      <div className="text-center">
        <div className="text-lg font-semibold">{prettyDate(date)}</div>
        {!isToday && (
          <Link href="/diary" className="text-xs text-accent hover:underline">
            Jump to today
          </Link>
        )}
      </div>
      <Link
        href={isFutureNext ? "#" : `/diary/${next}`}
        className={`btn-secondary inline-flex items-center gap-1 ${isFutureNext ? "opacity-30 pointer-events-none" : ""}`}
        aria-label="Next day"
        aria-disabled={isFutureNext}
      >
        Next <ChevronRight size={16} />
      </Link>
    </div>
  );
}
