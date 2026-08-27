"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Download, Share2, MessageCircle, ChevronDown } from "lucide-react"
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    pdf,
    Font,
} from "@react-pdf/renderer"
import type { LedgerEntry, PartyLedgerSummary } from "@/lib/actions/party-ledger"
import { format } from "date-fns"
import { downloadOrSharePdf } from "@/lib/pdf-download"

// ─── PDF Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    page: {
        fontFamily: "Helvetica",
        fontSize: 9,
        color: "#1A1A1A",
        backgroundColor: "#FFFFFF",
        padding: 32,
    },
    // Header
    headerSection: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 2,
        borderBottomColor: "#D4A017",
    },
    businessName: {
        fontSize: 16,
        fontFamily: "Helvetica-Bold",
        color: "#0F0F0F",
    },
    businessSub: {
        fontSize: 8,
        color: "#737373",
        marginTop: 2,
    },
    statementTitle: {
        fontSize: 13,
        fontFamily: "Helvetica-Bold",
        color: "#D4A017",
        textAlign: "right",
    },
    statementMeta: {
        fontSize: 7.5,
        color: "#737373",
        textAlign: "right",
        marginTop: 2,
    },
    // Party info box
    partyBox: {
        backgroundColor: "#F8F8F8",
        borderRadius: 6,
        padding: 10,
        marginBottom: 14,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    partyLabel: {
        fontSize: 7.5,
        color: "#737373",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    partyValue: {
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        color: "#0F0F0F",
        marginTop: 2,
    },
    partySubValue: {
        fontSize: 7.5,
        color: "#525252",
        marginTop: 1,
    },
    // Summary cards
    summaryRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 16,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: "#F8F8F8",
        borderRadius: 6,
        padding: 8,
        borderLeftWidth: 3,
    },
    summaryCardLabel: {
        fontSize: 7,
        color: "#737373",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    summaryCardValue: {
        fontSize: 12,
        fontFamily: "Helvetica-Bold",
        marginTop: 3,
    },
    // Table
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#0F0F0F",
        padding: "6 8",
        borderRadius: 4,
        marginBottom: 1,
    },
    tableHeaderCell: {
        fontSize: 7.5,
        color: "#D4A017",
        fontFamily: "Helvetica-Bold",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    tableRow: {
        flexDirection: "row",
        padding: "5 8",
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    tableRowAlt: {
        backgroundColor: "#FAFAFA",
    },
    tableRowOpening: {
        backgroundColor: "#FFF8E7",
    },
    tableCell: {
        fontSize: 8,
        color: "#1A1A1A",
    },
    tableCellGold: {
        fontSize: 7.5,
        color: "#D4A017",
        fontFamily: "Helvetica-Bold",
    },
    tableCellGreen: { fontSize: 8, color: "#16A34A", fontFamily: "Helvetica-Bold" },
    tableCellRed: { fontSize: 8, color: "#DC2626", fontFamily: "Helvetica-Bold" },
    // Footer
    tableFooter: {
        flexDirection: "row",
        backgroundColor: "#1A1A1A",
        padding: "7 8",
        borderRadius: 4,
        marginTop: 2,
    },
    tableFooterCell: {
        fontSize: 8.5,
        color: "#F5F5F5",
        fontFamily: "Helvetica-Bold",
    },
    // Widths
    colDate: { width: "12%" },
    colType: { width: "10%" },
    colRef: { width: "14%" },
    colDesc: { width: "32%" },
    colDebit: { width: "11%", textAlign: "right" },
    colCredit: { width: "11%", textAlign: "right" },
    colBalance: { width: "10%", textAlign: "right" },
    // Page footer
    pageFooter: {
        position: "absolute",
        bottom: 24,
        left: 32,
        right: 32,
        flexDirection: "row",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderTopColor: "#E5E5E5",
        paddingTop: 6,
    },
    pageFooterText: {
        fontSize: 7,
        color: "#A0A0A0",
    },
    goldLine: {
        height: 2,
        backgroundColor: "#D4A017",
        marginBottom: 12,
    },
})

// ─── PDF Document Component ──────────────────────────────────────────────────

interface StatementPDFProps {
    party: {
        name: string
        partyType: string
        gstin?: string | null
        phone?: string | null
        email?: string | null
        city?: string | null
        state?: string | null
    }
    entries: LedgerEntry[]
    summary: PartyLedgerSummary
    businessName: string
    fromDate?: Date
    toDate?: Date
    generatedAt: Date
}

function StatementPDF({
    party,
    entries,
    summary,
    businessName,
    fromDate,
    toDate,
    generatedAt,
}: StatementPDFProps) {
    const closingBalance =
        entries.length > 0 ? entries[entries.length - 1].runningBalance : 0

    const dateRangeText =
        fromDate && toDate
            ? `${format(fromDate, "dd MMM yyyy")} – ${format(toDate, "dd MMM yyyy")}`
            : fromDate
              ? `From ${format(fromDate, "dd MMM yyyy")}`
              : toDate
                ? `Up to ${format(toDate, "dd MMM yyyy")}`
                : "All transactions"

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.headerSection}>
                    <View>
                        <Text style={styles.businessName}>{businessName}</Text>
                        <Text style={styles.businessSub}>
                            Jewellery Manufacturing Business
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.statementTitle}>
                            PARTY STATEMENT
                        </Text>
                        <Text style={styles.statementMeta}>
                            Period: {dateRangeText}
                        </Text>
                        <Text style={styles.statementMeta}>
                            Generated: {format(generatedAt, "dd MMM yyyy, hh:mm a")}
                        </Text>
                    </View>
                </View>

                {/* Party Info */}
                <View style={styles.partyBox}>
                    <View>
                        <Text style={styles.partyLabel}>Party Name</Text>
                        <Text style={styles.partyValue}>{party.name}</Text>
                        <Text style={styles.partySubValue}>
                            {party.partyType === "CUSTOMER"
                                ? "Customer"
                                : party.partyType === "SUPPLIER"
                                  ? "Supplier"
                                  : "Customer & Supplier"}
                        </Text>
                    </View>
                    {party.gstin && (
                        <View>
                            <Text style={styles.partyLabel}>GSTIN</Text>
                            <Text style={styles.partyValue}>{party.gstin}</Text>
                        </View>
                    )}
                    {(party.phone || party.email) && (
                        <View>
                            <Text style={styles.partyLabel}>Contact</Text>
                            {party.phone && (
                                <Text style={styles.partyValue}>
                                    {party.phone}
                                </Text>
                            )}
                            {party.email && (
                                <Text style={styles.partySubValue}>
                                    {party.email}
                                </Text>
                            )}
                        </View>
                    )}
                    {(party.city || party.state) && (
                        <View>
                            <Text style={styles.partyLabel}>Location</Text>
                            <Text style={styles.partyValue}>
                                {[party.city, party.state]
                                    .filter(Boolean)
                                    .join(", ")}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Summary cards */}
                <View style={styles.summaryRow}>
                    <View
                        style={[
                            styles.summaryCard,
                            {
                                borderLeftColor:
                                    summary.balanceType === "debit"
                                        ? "#16A34A"
                                        : "#DC2626",
                            },
                        ]}
                    >
                        <Text style={styles.summaryCardLabel}>Outstanding</Text>
                        <Text
                            style={[
                                styles.summaryCardValue,
                                {
                                    color:
                                        summary.balanceType === "debit"
                                            ? "#16A34A"
                                            : "#DC2626",
                                },
                            ]}
                        >
                            Rs.
                            {summary.outstandingBalance.toLocaleString("en-IN")}
                        </Text>
                        <Text style={styles.partySubValue}>
                            {summary.balanceType === "debit"
                                ? "Receivable (Dr)"
                                : "Payable (Cr)"}
                        </Text>
                    </View>
                    <View style={[styles.summaryCard, { borderLeftColor: "#3B82F6" }]}>
                        <Text style={styles.summaryCardLabel}>Total Sales</Text>
                        <Text style={[styles.summaryCardValue, { color: "#3B82F6" }]}>
                            Rs.{summary.totalSales.toLocaleString("en-IN")}
                        </Text>
                    </View>
                    <View style={[styles.summaryCard, { borderLeftColor: "#F59E0B" }]}>
                        <Text style={styles.summaryCardLabel}>Total Purchases</Text>
                        <Text style={[styles.summaryCardValue, { color: "#F59E0B" }]}>
                            Rs.{summary.totalPurchases.toLocaleString("en-IN")}
                        </Text>
                    </View>
                    <View style={[styles.summaryCard, { borderLeftColor: "#8B5CF6" }]}>
                        <Text style={styles.summaryCardLabel}>Payments In</Text>
                        <Text style={[styles.summaryCardValue, { color: "#8B5CF6" }]}>
                            Rs.{summary.totalPaymentsIn.toLocaleString("en-IN")}
                        </Text>
                    </View>
                </View>

                {/* Table header */}
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, styles.colDate]}>
                        Date
                    </Text>
                    <Text style={[styles.tableHeaderCell, styles.colType]}>
                        Type
                    </Text>
                    <Text style={[styles.tableHeaderCell, styles.colRef]}>
                        Reference
                    </Text>
                    <Text style={[styles.tableHeaderCell, styles.colDesc]}>
                        Description
                    </Text>
                    <Text style={[styles.tableHeaderCell, styles.colDebit]}>
                        Debit
                    </Text>
                    <Text style={[styles.tableHeaderCell, styles.colCredit]}>
                        Credit
                    </Text>
                    <Text style={[styles.tableHeaderCell, styles.colBalance]}>
                        Balance
                    </Text>
                </View>

                {/* Table rows */}
                {entries.map((entry, idx) => {
                    const isOpening = entry.type === "opening"
                    const isAlt = idx % 2 === 1
                    const rowStyle = isOpening
                        ? styles.tableRowOpening
                        : isAlt
                          ? styles.tableRowAlt
                          : {}
                    const isBalancePos = entry.runningBalance >= 0

                    return (
                        <View key={`${entry.id}-${idx}`} style={[styles.tableRow, rowStyle]}>
                            <Text style={[styles.tableCell, styles.colDate]}>
                                {format(new Date(entry.date), "dd/MM/yy")}
                            </Text>
                            <Text style={[styles.tableCellGold, styles.colType]}>
                                {entry.type === "opening"
                                    ? "Opening"
                                    : entry.type === "sale"
                                      ? "Sale"
                                      : entry.type === "purchase"
                                        ? "Purch."
                                        : entry.type === "payment_in"
                                          ? "Pymt In"
                                          : entry.type === "payment_out"
                                            ? "Pymt Out"
                                            : entry.type === "sale_return"
                                              ? "Sale Ret."
                                              : "Purch. Ret."}
                            </Text>
                            <Text style={[styles.tableCell, styles.colRef]}>
                                {entry.referenceNumber}
                            </Text>
                            <Text style={[styles.tableCell, styles.colDesc]}>
                                {entry.description}
                            </Text>
                            <Text style={[styles.tableCell, styles.colDebit]}>
                                {entry.debit > 0
                                    ? `Rs.${entry.debit.toLocaleString("en-IN")}`
                                    : "—"}
                            </Text>
                            <Text style={[styles.tableCell, styles.colCredit]}>
                                {entry.credit > 0
                                    ? `Rs.${entry.credit.toLocaleString("en-IN")}`
                                    : "—"}
                            </Text>
                            <Text
                                style={[
                                    isBalancePos
                                        ? styles.tableCellGreen
                                        : styles.tableCellRed,
                                    styles.colBalance,
                                ]}
                            >
                                {`Rs.${Math.abs(entry.runningBalance).toLocaleString("en-IN")} ${isBalancePos ? "Dr" : "Cr"}`}
                            </Text>
                        </View>
                    )
                })}

                {/* Totals footer */}
                {entries.length > 0 && (
                    <View style={styles.tableFooter}>
                        <Text style={[styles.tableFooterCell, styles.colDate]} />
                        <Text style={[styles.tableFooterCell, styles.colType]} />
                        <Text style={[styles.tableFooterCell, styles.colRef]} />
                        <Text style={[styles.tableFooterCell, styles.colDesc]}>
                            CLOSING BALANCE
                        </Text>
                        <Text style={[styles.tableFooterCell, styles.colDebit]}>
                            Rs.
                            {entries
                                .reduce((s, e) => s + e.debit, 0)
                                .toLocaleString("en-IN")}
                        </Text>
                        <Text style={[styles.tableFooterCell, styles.colCredit]}>
                            Rs.
                            {entries
                                .reduce((s, e) => s + e.credit, 0)
                                .toLocaleString("en-IN")}
                        </Text>
                        <Text
                            style={[
                                styles.tableFooterCell,
                                styles.colBalance,
                                {
                                    color:
                                        closingBalance >= 0
                                            ? "#4ADE80"
                                            : "#F87171",
                                },
                            ]}
                        >
                            Rs.{Math.abs(closingBalance).toLocaleString("en-IN")}{" "}
                            {closingBalance >= 0 ? "Dr" : "Cr"}
                        </Text>
                    </View>
                )}

                {/* Page footer */}
                <View style={styles.pageFooter} fixed>
                    <Text style={styles.pageFooterText}>
                        {businessName} | Confidential Statement
                    </Text>
                    <Text
                        style={styles.pageFooterText}
                        render={({ pageNumber, totalPages }) =>
                            `Page ${pageNumber} of ${totalPages}`
                        }
                    />
                </View>
            </Page>
        </Document>
    )
}

// ─── Export Button Component ─────────────────────────────────────────────────

interface PartyStatementExportProps {
    party: StatementPDFProps["party"] & { name: string }
    entries: LedgerEntry[]
    summary: PartyLedgerSummary
    fromDate?: Date
    toDate?: Date
}

export function PartyStatementExport({
    party,
    entries,
    summary,
    fromDate,
    toDate,
}: PartyStatementExportProps) {
    const [isGenerating, setIsGenerating] = useState(false)
    const businessName = "Riddhi Siddhi Jewellery"

    const generatePDF = async () => {
        setIsGenerating(true)
        try {
            const doc = (
                <StatementPDF
                    party={party}
                    entries={entries}
                    summary={summary}
                    businessName={businessName}
                    fromDate={fromDate}
                    toDate={toDate}
                    generatedAt={new Date()}
                />
            )
            const blob = await pdf(doc).toBlob()
            await downloadOrSharePdf(blob, `Statement_${party.name.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.pdf`)
        } catch (err) {
            console.error("PDF generation error:", err)
        } finally {
            setIsGenerating(false)
        }
    }

    const shareOnWhatsApp = async () => {
        setIsGenerating(true)
        try {
            // Generate PDF blob and create a data URL for sharing reference
            const doc = (
                <StatementPDF
                    party={party}
                    entries={entries}
                    summary={summary}
                    businessName={businessName}
                    fromDate={fromDate}
                    toDate={toDate}
                    generatedAt={new Date()}
                />
            )
            const blob = await pdf(doc).toBlob()
            await downloadOrSharePdf(blob, `Statement_${party.name.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.pdf`)

            // Build WhatsApp message with statement summary
            const closingBalance =
                entries.length > 0
                    ? entries[entries.length - 1].runningBalance
                    : 0
            const balanceText =
                closingBalance >= 0
                    ? `Rs.${Math.abs(closingBalance).toLocaleString("en-IN")} (Receivable)`
                    : `Rs.${Math.abs(closingBalance).toLocaleString("en-IN")} (Payable)`

            const whatsappMessage = encodeURIComponent(
                `*${businessName}*\n` +
                    `━━━━━━━━━━━━━━━━━━━━\n` +
                    `📋 *Party Statement*\n` +
                    `Party: *${party.name}*\n` +
                    `Period: ${fromDate ? format(fromDate, "dd MMM yyyy") : "All"} – ${toDate ? format(toDate, "dd MMM yyyy") : "Today"}\n` +
                    `━━━━━━━━━━━━━━━━━━━━\n` +
                    `📈 Total Sales: Rs.${summary.totalSales.toLocaleString("en-IN")}\n` +
                    `📦 Total Purchases: Rs.${summary.totalPurchases.toLocaleString("en-IN")}\n` +
                    `💳 Payments Received: Rs.${summary.totalPaymentsIn.toLocaleString("en-IN")}\n` +
                    `━━━━━━━━━━━━━━━━━━━━\n` +
                    `💰 *Outstanding Balance: ${balanceText}*\n` +
                    `━━━━━━━━━━━━━━━━━━━━\n` +
                    `_(Detailed PDF statement downloaded — please attach it to this message)_`
            )

            // Open WhatsApp — use party phone if available
            const waPhone = party.phone
                ? party.phone.replace(/[^0-9]/g, "")
                : ""
            const waUrl = waPhone
                ? `https://wa.me/91${waPhone}?text=${whatsappMessage}`
                : `https://wa.me/?text=${whatsappMessage}`

            window.open(waUrl, "_blank")
        } catch (err) {
            console.error("WhatsApp share error:", err)
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="flex items-center gap-2">
            <Button
                onClick={generatePDF}
                disabled={isGenerating || entries.length === 0}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all hover:shadow-[0_0_16px_rgba(212,160,23,0.4)] disabled:opacity-50 h-9 px-4 text-sm"
            >
                <Download size={14} className="mr-2" />
                {isGenerating ? "Generating..." : "Export PDF"}
            </Button>

            <Button
                onClick={shareOnWhatsApp}
                disabled={isGenerating || entries.length === 0}
                className="bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold transition-all hover:shadow-[0_0_16px_rgba(37,211,102,0.4)] disabled:opacity-50 h-9 px-4 text-sm"
            >
                <MessageCircle size={14} className="mr-2" />
                WhatsApp
            </Button>
        </div>
    )
}
