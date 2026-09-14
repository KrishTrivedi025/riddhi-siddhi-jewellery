"use client"

import { eachDayOfInterval, endOfMonth, format, getDay, isAfter, isSameDay, startOfDay, startOfMonth } from "date-fns"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface WorkerAttendanceCalendarProps {
    month: Date
    stagedAbsentDates: Set<string>
    onToggleDate: (dateStr: string) => void
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"]

export function WorkerAttendanceCalendar({ month, stagedAbsentDates, onToggleDate }: WorkerAttendanceCalendarProps) {
    const monthStart = startOfMonth(month)
    const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(month) })
    const today = startOfDay(new Date())
    const leadingBlanks = getDay(monthStart)

    return (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">{format(month, "MMMM yyyy")}</p>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground uppercase">
                {WEEKDAY_LABELS.map((label, i) => (
                    <div key={i}>{label}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: leadingBlanks }).map((_, i) => (
                    <div key={`blank-${i}`} />
                ))}
                {days.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd")
                    const isFuture = isAfter(startOfDay(day), today)
                    const isAbsent = stagedAbsentDates.has(dateStr)
                    const isToday = isSameDay(day, today)

                    return (
                        <button
                            key={dateStr}
                            type="button"
                            disabled={isFuture}
                            onClick={() => onToggleDate(dateStr)}
                            className={cn(
                                "aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors",
                                isToday && "ring-1 ring-primary",
                                isFuture && "text-muted-foreground/30 cursor-not-allowed",
                                !isFuture && isAbsent && "bg-rose-500/15 text-rose-500",
                                !isFuture && !isAbsent && "bg-muted/60 text-foreground hover:bg-muted"
                            )}
                        >
                            <span>{format(day, "d")}</span>
                            {!isFuture && (isAbsent ? <X size={10} /> : <Check size={10} className="text-emerald-500" />)}
                        </button>
                    )
                })}
            </div>

            <p className="text-[11px] text-muted-foreground">
                Tap a day to mark it absent. Unmarked days count as present automatically.
            </p>
        </div>
    )
}
