export const PAYMENT_MODES = [
    { value: "cash", label: "Cash" },
    { value: "bank", label: "Bank Transfer" },
    { value: "upi", label: "UPI" },
    { value: "cheque", label: "Cheque" },
    { value: "card", label: "Credit/Debit Card" },
]

export function paymentModeLabel(mode: string): string {
    return PAYMENT_MODES.find((m) => m.value === mode)?.label ?? mode
}
