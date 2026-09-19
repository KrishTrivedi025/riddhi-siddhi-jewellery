"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"

interface AmountInputProps
    extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type" | "inputMode"> {
    value: number
    onValueChange: (value: number) => void
}

// Indian grouping: last 3 digits, then pairs — 1,25,000.
function groupIndian(digits: string): string {
    if (digits.length <= 3) return digits
    const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",")
    return `${rest},${digits.slice(-3)}`
}

// Keeps digits and a single dot, max 2 decimals.
function sanitize(raw: string): string {
    const s = raw.replace(/[^0-9.]/g, "")
    const dot = s.indexOf(".")
    if (dot === -1) return s
    return s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, "").slice(0, 2)
}

function formatText(clean: string): string {
    if (clean === "") return ""
    const dot = clean.indexOf(".")
    const hasDot = dot !== -1
    const int = (hasDot ? clean.slice(0, dot) : clean).replace(/^0+(?=\d)/, "") || "0"
    return groupIndian(int) + (hasDot ? `.${clean.slice(dot + 1)}` : "")
}

function parseAmount(text: string): number {
    return parseFloat(text.replace(/,/g, "")) || 0
}

function formatAmount(value: number): string {
    if (!value) return ""
    return formatText(String(Math.round(value * 100) / 100))
}

// Caret index just after the nth digit/dot in `text`.
function caretAfter(text: string, count: number): number {
    if (count <= 0) return 0
    let seen = 0
    for (let i = 0; i < text.length; i++) {
        if (text[i] !== ",") seen++
        if (seen === count) return i + 1
    }
    return text.length
}

// Numeric input that shows Indian-style commas as the user types. The parent owns the
// number; `text` only preserves what's being typed ("12.", "12.50") until it diverges
// from `value` (e.g. an auto-fill from another field), at which point value wins.
export function AmountInput({ value, onValueChange, onBlur, ...props }: AmountInputProps) {
    const [text, setText] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)
    const pendingCaret = useRef<number | null>(null)

    const display = parseAmount(text) === value ? text : formatAmount(value)

    useLayoutEffect(() => {
        if (pendingCaret.current !== null && inputRef.current) {
            inputRef.current.setSelectionRange(pendingCaret.current, pendingCaret.current)
            pendingCaret.current = null
        }
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value
        const caret = e.target.selectionStart ?? raw.length
        const typedBeforeCaret = raw.slice(0, caret).replace(/[^0-9.]/g, "").length

        const formatted = formatText(sanitize(raw))
        setText(formatted)
        onValueChange(parseAmount(formatted))
        pendingCaret.current = caretAfter(formatted, typedBeforeCaret)
    }

    return (
        <Input
            {...props}
            ref={inputRef}
            // "tel" forces a numeric keypad on Android WebViews that ignore inputMode alone;
            // inputMode="decimal" then upgrades it to a keypad with a decimal point where supported.
            type="tel"
            inputMode="decimal"
            autoComplete="off"
            value={display}
            onChange={handleChange}
            onBlur={(e) => {
                setText(formatAmount(value))
                onBlur?.(e)
            }}
        />
    )
}
