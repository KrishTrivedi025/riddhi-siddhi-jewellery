"use server"

const GST_API_KEYS = [process.env.GST_API_KEY, process.env.GST_API_KEY_FALLBACK].filter(
    (key): key is string => !!key
)

// gstincheck.co.in doesn't return a distinct status for "credits exhausted" vs
// other failures, so we treat any non-flag response whose message hints at
// quota/credit issues as exhausted (try next key) and anything else as a
// genuine invalid-GSTIN response (stop, don't burn the next key).
const EXHAUSTED_HINT = /credit|limit|exceed|quota|exhaust/i

async function tryKey(gstin: string, apiKey: string) {
    const url = `https://sheet.gstincheck.co.in/check/${apiKey}/${gstin}`

    const response = await fetch(url, {
        method: "GET",
        next: { revalidate: 3600 },
    })

    if (!response.ok) {
        return { ok: false as const, exhausted: true, message: "Verification service unavailable" }
    }

    const res = await response.json()

    if (!res.flag || !res.data) {
        const message = res.message || "No details found"
        return { ok: false as const, exhausted: EXHAUSTED_HINT.test(message), message }
    }

    return { ok: true as const, data: res.data }
}

export async function getGSTDetails(gstin: string) {
    if (GST_API_KEYS.length === 0) {
        return { success: false, error: "GST verification not configured" }
    }

    let lastMessage = "Verification failed. Check network or API key."

    for (const apiKey of GST_API_KEYS) {
        try {
            const result = await tryKey(gstin, apiKey)

            if (result.ok) {
                const info = result.data
                const address = info.pradr?.addr || {}

                // Deep scan for contact info (checking various possible keys/paths)
                const rawPhone = info.mobNum || info.contactDetail?.mobNum || info.contact_number || info.mobile || ""
                const rawEmail = info.emailId || info.contactDetail?.emailId || info.email_id || info.email || ""

                // Sanitize: Check if data is masked (contains too many asterisks)
                const isMasked = (val: string) => val.includes("****") || val.includes("******")
                const phone = isMasked(rawPhone) ? "" : rawPhone
                const email = isMasked(rawEmail) ? "" : rawEmail

                const addressLine = [address.bnm, address.st, address.loc].filter(Boolean).join(", ")

                return {
                    success: true,
                    data: {
                        name: info.lgnm || info.tradeNam || "N/A",
                        address: addressLine,
                        city: address.dst || "N/A",
                        state: address.stcd || "N/A",
                        pincode: address.pncd || "N/A",
                        phone,
                        email,
                        isContactRestricted: !phone && !email,
                    },
                }
            }

            lastMessage = result.message

            if (!result.exhausted) {
                // Genuine invalid GSTIN / not-found — no point burning the next key.
                return { success: false, error: lastMessage }
            }
        } catch (error) {
            console.error("GST Error:", error)
            lastMessage = "Verification failed. Check network or API key."
        }
    }

    return { success: false, error: lastMessage }
}
