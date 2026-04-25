// ─── Indian Number System: Amount to Words ──────────────────────────────────

const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
]

const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
]

function twoDigitWords(n: number): string {
    if (n < 20) return ones[n]
    const t = Math.floor(n / 10)
    const o = n % 10
    return tens[t] + (o ? " " + ones[o] : "")
}

function threeDigitWords(n: number): string {
    if (n === 0) return ""
    const h = Math.floor(n / 100)
    const rest = n % 100
    let result = ""
    if (h > 0) {
        result += ones[h] + " Hundred"
        if (rest > 0) result += " and "
    }
    if (rest > 0) {
        result += twoDigitWords(rest)
    }
    return result
}

/**
 * Convert a number to Indian words format
 * Uses Indian place value system: Crore, Lakh, Thousand, Hundred
 * 
 * Example: 12345.50 → "Rupees Twelve Thousand Three Hundred and Forty Five and Fifty Paise Only"
 */
export function numberToWords(amount: number): string {
    if (amount === 0) return "Rupees Zero Only"
    
    const isNegative = amount < 0
    amount = Math.abs(amount)
    
    const rupees = Math.floor(amount)
    const paise = Math.round((amount - rupees) * 100)

    if (rupees === 0 && paise === 0) return "Rupees Zero Only"

    let words = ""

    if (rupees > 0) {
        words = "Rupees " + convertToIndianWords(rupees)
    }

    if (paise > 0) {
        if (rupees > 0) words += " and "
        words += twoDigitWords(paise) + " Paise"
    }

    if (isNegative) words = "Minus " + words

    return words + " Only"
}

function convertToIndianWords(n: number): string {
    if (n === 0) return ""
    
    const crore = Math.floor(n / 10000000)
    n = n % 10000000
    const lakh = Math.floor(n / 100000)
    n = n % 100000
    const thousand = Math.floor(n / 1000)
    n = n % 1000
    const hundred = n

    const parts: string[] = []

    if (crore > 0) {
        parts.push(twoDigitWords(crore) + " Crore")
    }
    if (lakh > 0) {
        parts.push(twoDigitWords(lakh) + " Lakh")
    }
    if (thousand > 0) {
        parts.push(twoDigitWords(thousand) + " Thousand")
    }
    if (hundred > 0) {
        parts.push(threeDigitWords(hundred))
    }

    return parts.join(" ")
}
