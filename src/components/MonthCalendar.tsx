"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MIN_DATE, formatLocalDate, todayLocal } from "@/lib/date";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function parseDateStr(s: string): { y: number; m: number; d: number } {
  const [y, m, d] = s.split("-").map(Number);
  return { y, m: m - 1, d };
}

export function MonthCalendar({ selected }: { selected: string }) {
  const init = parseDateStr(selected);
  const [viewYear, setViewYear] = useState(init.y);
  const [viewMonth, setViewMonth] = useState(init.m);

  const today = todayLocal();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const cells: React.ReactNode[] = [];

  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(<div key={`empty-${i}`} className="h-9 w-9" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatLocalDate(new Date(viewYear, viewMonth, day));
    const isToday = dateStr === today;
    const isSelected = dateStr === selected;
    const isDisabled = dateStr < MIN_DATE || dateStr > today;

    const base =
      "flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors";

    let classes = base;
    if (isSelected) {
      classes += " bg-accent text-bg font-semibold";
    } else if (isDisabled) {
      classes += " text-muted opacity-40 cursor-not-allowed";
    } else {
      classes += " text-text hover:bg-panel2";
      if (isToday) classes += " ring-1 ring-accent";
    }

    if (isDisabled) {
      cells.push(
        <span key={dateStr} className={classes} aria-disabled="true">
          {day}
        </span>,
      );
    } else {
      cells.push(
        <Link
          key={dateStr}
          href={`/diary/${dateStr}`}
          className={classes}
          aria-label={dateStr}
          aria-current={isSelected ? "date" : undefined}
        >
          {day}
        </Link>,
      );
    }
  }

  return (
    <div className="card" aria-label="Date calendar">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={goPrev}
          className="btn-ghost inline-flex h-8 w-8 items-center justify-center"
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-sm font-semibold">
          {MONTHS[viewMonth]} {viewYear}
        </div>
        <button
          type="button"
          onClick={goNext}
          className="btn-ghost inline-flex h-8 w-8 items-center justify-center"
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="flex h-6 w-9 items-center justify-center text-[10px] font-medium text-muted"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">{cells}</div>
    </div>
  );
}
