"use server"

export async function getGSTDetails(gstin: string) {
    try {
        const apiKey = process.env.GST_API_KEY || "2b09d9b74c10653c21955161cee1d87d"
        const url = `https://sheet.gstincheck.co.in/check/${apiKey}/${gstin}`
        
        const response = await fetch(url, {
            method: "GET",
            next: { revalidate: 3600 }
        })

        if (!response.ok) {
            return { success: false, error: "Verification service unavailable" }
        }

        const res = await response.json()

        if (!res.flag || !res.data) {
            return { success: false, error: res.message || "No details found" }
        }

        const info = res.data
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
                isContactRestricted: !phone && !email
            }
        }
    } catch (error) {
        console.error("GST Error:", error)
        return { success: false, error: "Verification failed. Check network or API key." }
    }
}
