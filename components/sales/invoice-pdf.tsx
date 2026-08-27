"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { format } from "date-fns"
import { numberToWords } from "@/lib/amount-in-words"
import { downloadOrSharePdf } from "@/lib/pdf-download"

interface InvoicePDFProps {
    invoice: any
    businessProfile: any
}

export function InvoicePDF({ invoice, businessProfile }: InvoicePDFProps) {
    const [downloading, setDownloading] = useState(false)
    const isInterState = invoice.igst > 0

    const handleDownload = async () => {
        setDownloading(true)
        try {
            const { pdf, Document, Page, Text, View, StyleSheet, Image: PdfImage } = await import("@react-pdf/renderer")

            const gold = "#D4A017"
            const goldLight = "#F0C040"
            const dark = "#1A1A1A"
            const black = "#000000"
            const border = "#2A2A2A"

            const S = StyleSheet.create({
                page: { padding: 28, fontSize: 8, fontFamily: "Helvetica", color: black, backgroundColor: "#FFFFFF" },

                // TOP
                jurisdiction: { textAlign: "center", fontSize: 7, color: gold, fontFamily: "Helvetica-Bold", marginBottom: 6, letterSpacing: 1 },
                headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
                logoBox: { width: 60, height: 60, alignItems: "center", justifyContent: "center", marginRight: 12 },
                logoText: { fontSize: 22, fontFamily: "Helvetica-Bold", color: gold },
                bizName: { fontSize: 22, fontFamily: "Helvetica-Bold", color: dark },
                bizTagline: { fontSize: 8, color: "#666", marginTop: 2 },
                addressLine: { fontSize: 7.5, color: "#333", textAlign: "center", marginBottom: 2 },
                contactLine: { fontSize: 7.5, color: "#333", textAlign: "center", marginBottom: 4 },
                regRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6, paddingBottom: 5, borderBottom: `2px solid ${gold}` },
                regText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: dark },

                // TITLE
                taxInvoiceTitle: { textAlign: "center", fontSize: 14, fontFamily: "Helvetica-Bold", color: gold, marginBottom: 8, textDecoration: "underline" },

                // PARTY TABLE
                partyTable: { flexDirection: "row", border: `1px solid ${border}`, marginBottom: 8 },
                partyLeft: { flex: 1, padding: 6, borderRight: `1px solid ${border}` },
                partyRight: { width: "42%", padding: 6 },
                partyLabel: { fontSize: 7.5, color: "#555" },
                partyValue: { fontSize: 8, fontFamily: "Helvetica-Bold", color: dark },
                partyRow: { flexDirection: "row", marginBottom: 3 },
                partyRowLabel: { fontSize: 7.5, color: "#555", width: 95 },
                partyRowValue: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: dark, flex: 1 },

                // ITEMS TABLE
                tableWrap: { border: `1px solid ${border}`, marginBottom: 0 },
                tableHead: { flexDirection: "row", backgroundColor: dark, padding: "5 6" },
                thCell: { fontSize: 7, fontFamily: "Helvetica-Bold", color: gold, textAlign: "center" },
                tableRow: { flexDirection: "row", borderTop: `1px solid ${border}`, padding: "4 6", minHeight: 18 },
                tableRowAlt: { flexDirection: "row", borderTop: `1px solid ${border}`, padding: "4 6", minHeight: 18, backgroundColor: "#FAFAFA" },
                tdCell: { fontSize: 7.5, color: dark, textAlign: "center" },

                // BOTTOM SPLIT
                bottomRow: { flexDirection: "row", border: `1px solid ${border}`, borderTop: "none" },
                bottomLeft: { flex: 1, borderRight: `1px solid ${border}` },
                bottomRight: { width: "28%" },

                panRow: { flexDirection: "row", justifyContent: "space-between", padding: "4 6", borderBottom: `1px solid ${border}` },
                panText: { fontSize: 7.5, fontFamily: "Helvetica-Bold" },

                bankTitle: { textAlign: "center", fontSize: 8, fontFamily: "Helvetica-Bold", color: gold, padding: "3 0", borderBottom: `1px solid ${border}` },
                bankGrid: { flexDirection: "row", borderBottom: `1px solid ${border}` },
                bankCell: { flex: 1, padding: "3 5", borderRight: `1px solid ${border}` },
                bankLabel: { fontSize: 6.5, color: "#888" },
                bankVal: { fontSize: 7.5, fontFamily: "Helvetica-Bold" },

                wordsRow: { flexDirection: "row", padding: "3 6", borderBottom: `1px solid ${border}` },
                wordsLabel: { fontSize: 7.5, fontFamily: "Helvetica-Bold", width: 100 },
                wordsVal: { fontSize: 7.5, flex: 1 },

                totalLine: { flexDirection: "row", justifyContent: "space-between", padding: "3 6", borderBottom: `1px solid ${border}` },
                totalLabel: { fontSize: 7.5, color: "#333" },
                totalVal: { fontSize: 7.5, fontFamily: "Helvetica-Bold" },
                grandLine: { flexDirection: "row", justifyContent: "space-between", padding: "5 6", backgroundColor: dark },
                grandLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: gold },
                grandVal: { fontSize: 10, fontFamily: "Helvetica-Bold", color: gold },

                // GST BREAKUP
                gstTable: { border: `1px solid ${border}`, borderTop: "none", marginBottom: 8 },
                gstHead: { flexDirection: "row", backgroundColor: dark, padding: "4 5" },
                gstRow: { flexDirection: "row", borderTop: `1px solid ${border}`, padding: "3 5" },
                gstTh: { fontSize: 7, fontFamily: "Helvetica-Bold", color: gold, textAlign: "center" },
                gstTd: { fontSize: 7.5, color: dark, textAlign: "center" },

                // TERMS + SIGN
                termsSignRow: { flexDirection: "row", border: `1px solid ${border}`, marginBottom: 8 },
                termsBox: { flex: 1, padding: "6 8", borderRight: `1px solid ${border}` },
                termsTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", marginBottom: 4, color: gold },
                termItem: { fontSize: 7, color: "#333", marginBottom: 2 },
                signBox: { width: "35%", padding: "6 8", alignItems: "center", justifyContent: "flex-end" },
                signTitle: { fontSize: 7.5, fontFamily: "Helvetica-Bold", marginBottom: 4, color: gold, textAlign: "center" },
                signLine: { borderTop: `1px solid ${dark}`, width: 100, marginTop: 30, marginBottom: 3 },
                signLabel: { fontSize: 7, color: "#555", marginTop: 4 },

                footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
                footerText: { fontSize: 7, color: "#555" },
            })

            // helpers
            const col = (w: string) => ({ width: w })
            const biz = businessProfile || {} as any
            const bank = biz.defaultBank || {} as any
            const party = invoice.party || {}
            const items = invoice.items || []

            // per-item GST rate grouping for breakup
            type GSTGroup = { taxableValue: number; sgst: number; cgst: number; igst: number; total: number }
            const gstGroups: Record<string, GSTGroup & { hsn: string }> = {}
            items.forEach((item: any) => {
                const key = item.hsnCode || "N/A"
                if (!gstGroups[key]) gstGroups[key] = { hsn: key, taxableValue: 0, sgst: 0, cgst: 0, igst: 0, total: 0 }
                const taxable = item.amount / (1 + item.gstRate / 100)
                const tax = item.amount - taxable
                gstGroups[key].taxableValue += taxable
                if (isInterState) { gstGroups[key].igst += tax } else { gstGroups[key].sgst += tax / 2; gstGroups[key].cgst += tax / 2 }
                gstGroups[key].total += tax
            })
            const gstRows = Object.values(gstGroups)
            const totSGST = gstRows.reduce((s, r) => s + r.sgst, 0)
            const totCGST = gstRows.reduce((s, r) => s + r.cgst, 0)
            const totIGST = gstRows.reduce((s, r) => s + r.igst, 0)
            const totTax = gstRows.reduce((s, r) => s + r.total, 0)

            const fmt = (n: number) => `${n.toFixed(2)}`
            const fmtR = (n: number) => `\u20B9${n.toFixed(2)}`

            const InvoiceDoc = () => (
                <Document>
                    <Page size="A4" style={S.page}>

                        {/* JURISDICTION */}
                        <Text style={S.jurisdiction}>SUBJECT TO {(biz.state || "MUMBAI").toUpperCase()} JURISDICTION</Text>

                        {/* LOGO + BIZ NAME */}
                        <View style={S.headerRow}>
                            <View style={S.logoBox}>
                                {biz.logoUrl ? (
                                    <PdfImage src={biz.logoUrl} style={{ width: 60, height: 60, objectFit: "contain" }} />
                                ) : (
                                    <Text style={S.logoText}>
                                        {(biz.businessName || "RS").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                                    </Text>
                                )}
                            </View>
                            <View>
                                <Text style={S.bizName}>{biz.businessName || "Riddhi Siddhi Jewellery"}</Text>
                                <Text style={S.bizTagline}>{biz.businessType || "Jewellery Manufacturer & Retailer"}</Text>
                            </View>
                        </View>

                        {/* ADDRESS */}
                        <Text style={S.addressLine}>{biz.address}{biz.city ? `, ${biz.city}` : ""}{biz.state ? `, ${biz.state}` : ""}{biz.pincode ? ` - ${biz.pincode}` : ""}</Text>
                        <Text style={S.contactLine}>
                            {biz.mobile ? `Mob. : ${biz.mobile}` : ""}
                            {biz.email ? `  |  E-Mail : ${biz.email}` : ""}
                        </Text>

                        {/* GSTIN | MSME */}
                        <View style={S.regRow}>
                            <Text style={S.regText}>GSTIN/UIN : {biz.gstin || "—"}</Text>
                            <Text style={S.regText}>PAN : {biz.pan || "—"}</Text>
                        </View>

                        {/* INVOICE TITLE */}
                        <Text style={S.taxInvoiceTitle}>{invoice.isGst === false ? "ESTIMATE/ON ARRIVAL" : "TAX INVOICE"}</Text>

                        {/* PARTY TABLE */}
                        <View style={S.partyTable}>
                            <View style={S.partyLeft}>
                                <View style={{ flexDirection: "row", marginBottom: 3 }}>
                                    <Text style={S.partyLabel}>M/s.  </Text>
                                    <Text style={S.partyValue}>{party.name || "—"}</Text>
                                </View>
                                <View style={{ marginBottom: 3 }}>
                                    <Text style={S.partyLabel}>Address :  {party.billingAddress || "—"}{party.city ? `, ${party.city}` : ""}</Text>
                                </View>
                                <View style={[S.partyRow, { flexDirection: "row" }]}>
                                    <Text style={S.partyLabel}>Party's GSTIN No. : </Text>
                                    <Text style={S.partyValue}>{party.gstin || "—"}</Text>
                                </View>
                                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                    <View style={{ flexDirection: "row" }}>
                                        <Text style={S.partyLabel}>State : </Text>
                                        <Text style={S.partyValue}>{party.state || "—"}</Text>
                                    </View>
                                    <View style={{ flexDirection: "row" }}>
                                        <Text style={S.partyLabel}>Code : </Text>
                                        <Text style={S.partyValue}>{party.pincode || "—"}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={S.partyRight}>
                                <View style={S.partyRow}>
                                    <Text style={S.partyRowLabel}>Invoice No. :</Text>
                                    <Text style={S.partyRowValue}>
                                        {invoice.invoiceNumber}
                                    </Text>
                                </View>
                                <View style={S.partyRow}>
                                    <Text style={S.partyRowLabel}>Invoice Date :</Text>
                                    <Text style={S.partyRowValue}>{format(new Date(invoice.invoiceDate), "dd-MM-yyyy")}</Text>
                                </View>
                                <View style={S.partyRow}>
                                    <Text style={S.partyRowLabel}>Delivery Mode :</Text>
                                    <Text style={S.partyRowValue}>By Hand Carry</Text>
                                </View>
                                <View style={S.partyRow}>
                                    <Text style={S.partyRowLabel}>Transport :</Text>
                                    <Text style={S.partyRowValue}>N</Text>
                                </View>
                                <View style={S.partyRow}>
                                    <Text style={S.partyRowLabel}>L.R.No. :</Text>
                                    <Text style={S.partyRowValue}>N</Text>
                                </View>
                            </View>
                        </View>

                        {/* ITEMS TABLE */}
                        <View style={S.tableWrap}>
                            <View style={S.tableHead}>
                                <Text style={[S.thCell, col("5%")]}>Sr.{"\n"}No.</Text>
                                <Text style={[S.thCell, col("28%")]}>Description Of Goods</Text>
                                <Text style={[S.thCell, col("10%")]}>HSN/SAC</Text>
                                <Text style={[S.thCell, col("7%")]}>Gst %</Text>
                                <Text style={[S.thCell, col("10%")]}>Quantity</Text>
                                <Text style={[S.thCell, col("7%")]}>Per</Text>
                                <Text style={[S.thCell, col("13%")]}>Rate</Text>
                                <Text style={[S.thCell, col("13%"), { textAlign: "right" }]}>Amount</Text>
                            </View>

                            {items.map((item: any, idx: number) => (
                                <View key={item.id} style={idx % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                                    <Text style={[S.tdCell, col("5%")]}>{idx + 1}</Text>
                                    <Text style={[S.tdCell, col("28%"), { textAlign: "left" }]}>{item.itemName}{item.purity ? `\n(${item.purity})` : ""}{item.makingCharges > 0 ? `\nMaking: \u20B9${item.makingCharges.toFixed(2)}` : ""}</Text>
                                    <Text style={[S.tdCell, col("10%")]}>{item.hsnCode || "—"}</Text>
                                    <Text style={[S.tdCell, col("7%")]}>{item.gstRate} %</Text>
                                    <Text style={[S.tdCell, col("10%")]}>{item.quantity} {item.unit}</Text>
                                    <Text style={[S.tdCell, col("7%")]}>{item.unit}</Text>
                                    <Text style={[S.tdCell, col("13%")]}>{fmt(item.unitPrice)}</Text>
                                    <Text style={[S.tdCell, col("13%"), { textAlign: "right", fontFamily: "Helvetica-Bold" }]}>{fmt(item.amount)}</Text>
                                </View>
                            ))}

                            {/* empty rows to fill space */}
                            {Array.from({ length: Math.max(0, 6 - items.length) }).map((_, i) => (
                                <View key={`empty-${i}`} style={[S.tableRow, { minHeight: 18 }]}>
                                    <Text style={[S.tdCell, col("100%")]}> </Text>
                                </View>
                            ))}
                        </View>

                        {/* BOTTOM SECTION */}
                        <View style={S.bottomRow}>
                            {/* LEFT */}
                            <View style={S.bottomLeft}>
                                {/* PAN + Taxable Value */}
                                <View style={S.panRow}>
                                    <Text style={S.panText}>Company's PAN : {biz.pan || "—"}</Text>
                                    <Text style={S.panText}>Taxable Value</Text>
                                </View>

                                {/* Bank Details */}
                                <Text style={S.bankTitle}>Company's Bank Details</Text>
                                <View style={S.bankGrid}>
                                    <View style={S.bankCell}>
                                        <Text style={S.bankLabel}>A/c Holder's Name</Text>
                                        <Text style={S.bankVal}>{bank.accountName || biz.businessName || "—"}</Text>
                                    </View>
                                    <View style={S.bankCell}>
                                        <Text style={S.bankLabel}>Bank</Text>
                                        <Text style={S.bankVal}>{bank.bankName || "—"}</Text>
                                    </View>
                                    <View style={[S.bankCell, { borderRight: "none" }]}>
                                        <Text style={S.bankLabel}>A/c Type</Text>
                                        <Text style={S.bankVal}>Current</Text>
                                    </View>
                                </View>
                                <View style={[S.bankGrid, { borderBottom: `1px solid ${border}` }]}>
                                    <View style={S.bankCell}>
                                        <Text style={S.bankLabel}>Bank A/c No.</Text>
                                        <Text style={S.bankVal}>{bank.accountNumber || "—"}</Text>
                                    </View>
                                    <View style={S.bankCell}>
                                        <Text style={S.bankLabel}>IFSC</Text>
                                        <Text style={S.bankVal}>{bank.ifscCode || "—"}</Text>
                                    </View>
                                    <View style={[S.bankCell, { borderRight: "none" }]}>
                                        <Text style={S.bankLabel}>Branch</Text>
                                        <Text style={S.bankVal}>{bank.branchName || "—"}</Text>
                                    </View>
                                </View>

                                {/* Amount in Words */}
                                <View style={S.wordsRow}>
                                    <Text style={S.wordsLabel}>Amount Chargeable{"\n"}(In Words) :</Text>
                                    <Text style={S.wordsVal}> </Text>
                                </View>
                                <View style={{ padding: "3 5 5 5" }}>
                                    <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold" }}>INR : {numberToWords(invoice.grandTotal)}</Text>
                                </View>
                            </View>

                            {/* RIGHT - TOTALS */}
                            <View style={S.bottomRight}>
                                <View style={S.totalLine}>
                                    <Text style={S.totalLabel}>Taxable Value</Text>
                                    <Text style={S.totalVal}>{fmt(invoice.taxableAmount)}</Text>
                                </View>
                                {isInterState ? (
                                    <>
                                        <View style={S.totalLine}>
                                            <Text style={S.totalLabel}>IGST  %</Text>
                                            <Text style={S.totalVal}>{fmt(invoice.igst)}</Text>
                                        </View>
                                        <View style={S.totalLine}>
                                            <Text style={S.totalLabel}>CGST  %</Text>
                                            <Text style={S.totalVal}>0.00</Text>
                                        </View>
                                        <View style={S.totalLine}>
                                            <Text style={S.totalLabel}>SGST  %</Text>
                                            <Text style={S.totalVal}>0.00</Text>
                                        </View>
                                    </>
                                ) : (
                                    <>
                                        <View style={S.totalLine}>
                                            <Text style={S.totalLabel}>SGST  %</Text>
                                            <Text style={S.totalVal}>{fmt(invoice.sgst)}</Text>
                                        </View>
                                        <View style={S.totalLine}>
                                            <Text style={S.totalLabel}>CGST  %</Text>
                                            <Text style={S.totalVal}>{fmt(invoice.cgst)}</Text>
                                        </View>
                                        <View style={S.totalLine}>
                                            <Text style={S.totalLabel}>IGST  %</Text>
                                            <Text style={S.totalVal}>0.00</Text>
                                        </View>
                                    </>
                                )}
                                <View style={S.totalLine}>
                                    <Text style={S.totalLabel}>R.Off.(+)</Text>
                                    <Text style={S.totalVal}>{fmt(invoice.roundOff)}</Text>
                                </View>
                                <View style={S.grandLine}>
                                    <Text style={S.grandLabel}>G.Total</Text>
                                    <Text style={S.grandVal}>{fmt(invoice.grandTotal)}</Text>
                                </View>
                            </View>
                        </View>

                        {/* GST BREAKUP TABLE */}
                        <View style={S.gstTable}>
                            <View style={S.gstHead}>
                                <Text style={[S.gstTh, col("12%")]}>HSN/SAC</Text>
                                <Text style={[S.gstTh, col("18%")]}>Taxable Value</Text>
                                <Text style={[S.gstTh, col("12%")]}>SGST</Text>
                                <Text style={[S.gstTh, col("3%")]}> </Text>
                                <Text style={[S.gstTh, col("12%")]}>CGST</Text>
                                <Text style={[S.gstTh, col("3%")]}> </Text>
                                <Text style={[S.gstTh, col("12%")]}>IGST</Text>
                                <Text style={[S.gstTh, col("3%")]}> </Text>
                                <Text style={[S.gstTh, col("20%"), { textAlign: "right" }]}>Total Tax Amount</Text>
                            </View>
                            {gstRows.map((row, i) => (
                                <View key={i} style={S.gstRow}>
                                    <Text style={[S.gstTd, col("12%")]}>{row.hsn}</Text>
                                    <Text style={[S.gstTd, col("18%")]}>{fmt(row.taxableValue)}</Text>
                                    <Text style={[S.gstTd, col("12%")]}>{fmt(row.sgst)}</Text>
                                    <Text style={[S.gstTd, col("3%")]}> </Text>
                                    <Text style={[S.gstTd, col("12%")]}>{fmt(row.cgst)}</Text>
                                    <Text style={[S.gstTd, col("3%")]}> </Text>
                                    <Text style={[S.gstTd, col("12%")]}>{fmt(row.igst)}</Text>
                                    <Text style={[S.gstTd, col("3%")]}> </Text>
                                    <Text style={[S.gstTd, col("20%"), { textAlign: "right" }]}>{fmt(row.total)}</Text>
                                </View>
                            ))}
                            {/* Total row */}
                            <View style={[S.gstRow, { backgroundColor: "#F0F0F0" }]}>
                                <Text style={[S.gstTd, col("12%"), { fontFamily: "Helvetica-Bold" }]}>Total</Text>
                                <Text style={[S.gstTd, col("18%"), { fontFamily: "Helvetica-Bold" }]}>{fmt(invoice.taxableAmount)}</Text>
                                <Text style={[S.gstTd, col("12%"), { fontFamily: "Helvetica-Bold" }]}>{fmt(totSGST)}</Text>
                                <Text style={[S.gstTd, col("3%")]}> </Text>
                                <Text style={[S.gstTd, col("12%"), { fontFamily: "Helvetica-Bold" }]}>{fmt(totCGST)}</Text>
                                <Text style={[S.gstTd, col("3%")]}> </Text>
                                <Text style={[S.gstTd, col("12%"), { fontFamily: "Helvetica-Bold" }]}>{fmt(totIGST)}</Text>
                                <Text style={[S.gstTd, col("3%")]}> </Text>
                                <Text style={[S.gstTd, col("20%"), { textAlign: "right", fontFamily: "Helvetica-Bold" }]}>{fmt(totTax)}</Text>
                            </View>
                        </View>

                        {/* TERMS + SIGNATURE */}
                        <View style={S.termsSignRow}>
                            <View style={S.termsBox}>
                                <Text style={S.termsTitle}>Terms & Condition</Text>
                                {( (invoice.termsConditions && invoice.termsConditions.trim())
                                    ? invoice.termsConditions.split(/\r?\n/)
                                    : ( (biz.termsConditions && biz.termsConditions.trim())
                                        ? biz.termsConditions.split(/\r?\n/)
                                        : [
                                            "1. Our risk & responsibility ceases as Soon as the goods leave our premises.",
                                            "2. Intrest at 18% will be charged from the due date of payment.",
                                            "3. Goods sold once will not be taken back.",
                                        ]
                                    )
                                ).map((line: string, i: number) => (
                                    <Text key={i} style={S.termItem}>{line}</Text>
                                ))}
                            </View>
                            <View style={S.signBox}>
                                <Text style={S.signTitle}>For {biz.businessName || "Riddhi Siddhi Jewellery"}</Text>
                                {biz.signatureUrl ? (
                                    <PdfImage src={biz.signatureUrl} style={{ width: 150, height: 150, objectFit: "fit", marginVertical: 4 }} />
                                ) : (
                                    <View style={S.signLine} />
                                )}
                                <Text style={S.signLabel}>Authorised Signatory</Text>
                            </View>
                        </View>

                        {/* FOOTER */}
                        <View style={S.footer}>
                            <Text style={S.footerText}>This is a Computer Generated Invoice</Text>
                            <Text style={[S.footerText, { fontFamily: "Helvetica-Bold" }]}>E.&.O.E.</Text>
                        </View>

                    </Page>
                </Document>
            )

            const blob = await pdf(<InvoiceDoc />).toBlob()
            await downloadOrSharePdf(blob, `${invoice.invoiceNumber}.pdf`)
        } catch (err) {
            console.error("PDF generation error:", err)
            toast.error("Failed to generate PDF. Please try again.")
        } finally {
            setDownloading(false)
        }
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="text-center">
                <p className="text-sm text-foreground">
                    {invoice.isGst === false ? "Invoice PDF (Without GST)" : "Professional Tax Invoice PDF"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    {invoice.isGst === false
                        ? "Includes party details, bank info & authorised signatory"
                        : "Includes party details, bank info, GST breakup table & authorised signatory"}
                </p>
            </div>
            <Button
                onClick={handleDownload}
                disabled={downloading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6"
            >
                {downloading ? (
                    <><Loader2 size={16} className="mr-2 animate-spin" /> Generating PDF...</>
                ) : (
                    <><Download size={16} className="mr-2" /> {invoice.isGst === false ? "Download Invoice" : "Download Tax Invoice"}</>
                )}
            </Button>
        </div>
    )
}
