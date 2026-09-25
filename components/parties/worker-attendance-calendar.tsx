"use client"

import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, isAfter, isSameDay, isSameMonth, startOfDay, startOfMonth, subMonths } from "date-fns"
import { Check, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { WorkerDayStatus } from "@/lib/actions/workers"

interface WorkerAttendanceCalendarProps {
    month: Date
    onMonthChange: (month: Date) => void
    dayStatus: Record<string, WorkerDayStatus>
    selectedDate: string | null
    onSelectDate: (dateStr: string) => void
    savingDate: string | null
    onSetStatus: (dateStr: string, status: WorkerDayStatus | "PRESENT") => void
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"]

export function WorkerAttendanceCalendar({
    month,
    onMonthChange,
    dayStatus,
    selectedDate,
    onSelectDate,
    savingDate,
    onSetStatus,
}: WorkerAttendanceCalendarProps) {
    const monthStart = startOfMonth(month)
    const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(month) })
    const today = startOfDay(new Date())
    const leadingBlanks = getDay(monthStart)
    const selectedStatus = selectedDate ? dayStatus[selectedDate] : undefined
    const isCurrentMonth = isSameMonth(month, today)

    return (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => onMonthChange(subMonths(monthStart, 1))}
                    className="p-1.5 -ml-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label="Previous month"
                >
                    <ChevronLeft size={16} />
                </button>
                <p className="text-sm font-semibold text-foreground">{format(month, "MMMM yyyy")}</p>
                <button
                    type="button"
                    onClick={() => onMonthChange(addMonths(monthStart, 1))}
                    disabled={isCurrentMonth}
                    className="p-1.5 -mr-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Next month"
                >
                    <ChevronRight size={16} />
                </button>
            </div>

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
                    const status = dayStatus[dateStr]
                    const isAbsent = status === "ABSENT"
                    const isHalfDay = status === "HALF_DAY"
                    const isToday = isSameDay(day, today)
                    const isSelected = selectedDate === dateStr

                    return (
                        <button
                            key={dateStr}
                            type="button"
                            disabled={isFuture}
                            onClick={() => onSelectDate(dateStr)}
                            className={cn(
                                "aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors",
                                isSelected ? "ring-2 ring-primary" : isToday && "ring-1 ring-primary",
                                isFuture && "text-muted-foreground/30 cursor-not-allowed",
                                !isFuture && isAbsent && "bg-rose-500/15 text-rose-500",
                                !isFuture && isHalfDay && "bg-amber-500/15 text-amber-500",
                                !isFuture && !isAbsent && !isHalfDay && "bg-muted/60 text-foreground hover:bg-muted"
                            )}
                        >
                            <span>{format(day, "d")}</span>
                            {!isFuture &&
                                (isAbsent ? (
                                    <X size={10} />
                                ) : isHalfDay ? (
                                    <Check size={10} className="text-amber-500" />
                                ) : (
                                    <Check size={10} className="text-emerald-500" />
                                ))}
                        </button>
                    )
                })}
            </div>

            <p className="text-[11px] text-muted-foreground">
                Tap a day to mark it absent, half day, or present.
            </p>

            {selectedDate && (
                <div className="flex justify-end gap-2">
                    {selectedStatus === undefined && (
                        <>
                            <ActionButton
                                label="Half Day"
                                loading={savingDate === selectedDate}
                                className="bg-amber-500 hover:bg-amber-500/90"
                                onClick={() => onSetStatus(selectedDate, "HALF_DAY")}
                            />
                            <ActionButton
                                label="Mark Absent"
                                loading={savingDate === selectedDate}
                                className="bg-rose-600 hover:bg-rose-600/90"
                                onClick={() => onSetStatus(selectedDate, "ABSENT")}
                            />
                        </>
                    )}
                    {(selectedStatus === "ABSENT" || selectedStatus === "HALF_DAY") && (
                        <ActionButton
                            label="Mark Present"
                            loading={savingDate === selectedDate}
                            className="bg-emerald-600 hover:bg-emerald-600/90"
                            onClick={() => onSetStatus(selectedDate, "PRESENT")}
                        />
                    )}
                </div>
            )}
        </div>
    )
}

function ActionButton({
    label,
    loading,
    className,
    onClick,
}: {
    label: string
    loading: boolean
    className: string
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={loading}
            className={cn(
                "h-8 rounded-full text-white text-xs font-semibold px-4 flex items-center gap-1.5 transition-colors disabled:opacity-60",
                className
            )}
        >
            {loading ? <Loader2 size={12} className="animate-spin" /> : label}
        </button>
    )
}
