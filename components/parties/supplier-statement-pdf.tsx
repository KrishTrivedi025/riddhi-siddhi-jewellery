import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { format, isSameDay } from "date-fns"
import type { SupplierTransactionWithBalance } from "@/lib/actions/supplier-transactions"

const styles = StyleSheet.create({
    page: {
        fontFamily: "Helvetica",
        fontSize: 9,
        color: "#1A1A1A",
        backgroundColor: "#FFFFFF",
        padding: 32,
    },
    businessName: {
        fontSize: 13,
        fontFamily: "Helvetica-Bold",
        color: "#0F0F0F",
        marginBottom: 16,
    },
    titleRow: { alignItems: "center", marginBottom: 4 },
    title: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#0F0F0F" },
    subtitle: { fontSize: 8.5, color: "#737373", marginTop: 2, marginBottom: 16 },
    summaryBox: {
        flexDirection: "row",
        borderWidth: 1,
        borderColor: "#E5E5E5",
        borderRadius: 6,
        padding: 12,
        marginBottom: 16,
    },
    summaryCell: { flex: 1 },
    summaryLabel: { fontSize: 7.5, color: "#737373" },
    summaryValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0F0F0F", marginTop: 3 },
    summarySub: { fontSize: 7, color: "#737373", marginTop: 1 },
    entryCount: { fontSize: 8, color: "#525252", marginBottom: 6 },
    tableHeader: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#0F0F0F",
        paddingBottom: 4,
        marginBottom: 2,
    },
    tableHeaderCell: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#0F0F0F", textTransform: "uppercase" },
    dateGroupHeader: {
        backgroundColor: "#F8F8F8",
        padding: "4 6",
        marginTop: 4,
    },
    dateGroupText: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#525252" },
    tableRow: {
        flexDirection: "row",
        padding: "4 6",
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    tableCell: { fontSize: 8, color: "#1A1A1A" },
    tableFooter: {
        flexDirection: "row",
        backgroundColor: "#F8F8F8",
        padding: "6 6",
        borderTopWidth: 1,
        borderTopColor: "#0F0F0F",
        marginTop: 2,
    },
    tableFooterCell: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#0F0F0F" },
    colDate: { width: "13%" },
    colDetails: { width: "42%" },
    colDebit: { width: "15%", textAlign: "right" },
    colCredit: { width: "15%", textAlign: "right" },
    colBalance: { width: "15%", textAlign: "right" },
    redText: { color: "#DC2626" },
    greenText: { color: "#16A34A" },
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
    pageFooterText: { fontSize: 7, color: "#A0A0A0" },
})

interface SupplierStatementDocumentProps {
    businessName: string
    partyName: string
    transactions: SupplierTransactionWithBalance[] // chronological (oldest first)
    openingBalance: number
    fromDate?: Date
    toDate?: Date
    generatedAt: Date
}

export function SupplierStatementDocument({
    businessName,
    partyName,
    transactions,
    openingBalance,
    fromDate,
    toDate,
    generatedAt,
}: SupplierStatementDocumentProps) {
    const totalDebit = transactions.reduce((s, t) => s + (t.type === "GAVE" ? t.amount : 0), 0)
    const totalCredit = transactions.reduce((s, t) => s + (t.type === "GOT" ? t.amount : 0), 0)
    const netBalance = transactions.length > 0 ? transactions[transactions.length - 1].runningBalance : openingBalance
    const isGet = netBalance > 0

    const dateRangeText =
        fromDate && toDate
            ? `(${format(fromDate, "d MMM yyyy")} - ${format(toDate, "d MMM yyyy")})`
            : "(All time)"

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.businessName}>{businessName}</Text>

                <View style={styles.titleRow}>
                    <Text style={styles.title}>{partyName} Statement</Text>
                    <Text style={styles.subtitle}>{dateRangeText}</Text>
                </View>

                <View style={styles.summaryBox}>
                    <View style={styles.summaryCell}>
                        <Text style={styles.summaryLabel}>Opening Balance</Text>
                        <Text style={styles.summaryValue}>Rs.{Math.abs(openingBalance).toLocaleString("en-IN")}</Text>
                        {fromDate && (
                            <Text style={styles.summarySub}>(on {format(fromDate, "d MMM yyyy")})</Text>
                        )}
                    </View>
                    <View style={styles.summaryCell}>
                        <Text style={styles.summaryLabel}>Total Debit(-)</Text>
                        <Text style={[styles.summaryValue, styles.redText]}>
                            Rs.{totalDebit.toLocaleString("en-IN")}
                        </Text>
                    </View>
                    <View style={styles.summaryCell}>
                        <Text style={styles.summaryLabel}>Total Credit(+)</Text>
                        <Text style={[styles.summaryValue, styles.greenText]}>
                            Rs.{totalCredit.toLocaleString("en-IN")}
                        </Text>
                    </View>
                    <View style={styles.summaryCell}>
                        <Text style={styles.summaryLabel}>Net Balance</Text>
                        <Text style={[styles.summaryValue, isGet ? styles.greenText : styles.redText]}>
                            Rs.{Math.abs(netBalance).toLocaleString("en-IN")} {isGet ? "Dr" : "Cr"}
                        </Text>
                        <Text style={styles.summarySub}>
                            {isGet ? `(${partyName} will give)` : "(You will give)"}
                        </Text>
                    </View>
                </View>

                <Text style={styles.entryCount}>No. of Entries: {transactions.length} (All)</Text>

                <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, styles.colDate]}>Date</Text>
                    <Text style={[styles.tableHeaderCell, styles.colDetails]}>Details</Text>
                    <Text style={[styles.tableHeaderCell, styles.colDebit]}>Debit(-)</Text>
                    <Text style={[styles.tableHeaderCell, styles.colCredit]}>Credit(+)</Text>
                    <Text style={[styles.tableHeaderCell, styles.colBalance]}>Balance</Text>
                </View>

                {transactions.map((t, idx) => {
                    const prev = transactions[idx - 1]
                    const isNewDay = !prev || !isSameDay(prev.date, t.date)
                    const dayOpening = isNewDay
                        ? t.runningBalance - (t.type === "GAVE" ? t.amount : -t.amount)
                        : 0

                    return (
                        <View key={t.id}>
                            {isNewDay && (
                                <View style={styles.dateGroupHeader}>
                                    <Text style={styles.dateGroupText}>
                                        {format(t.date, "d MMMM yyyy")} (Opening Balance: {dayOpening.toFixed(2)})
                                    </Text>
                                </View>
                            )}
                            <View style={styles.tableRow}>
                                <Text style={[styles.tableCell, styles.colDate]}>{format(t.date, "d MMM")}</Text>
                                <Text style={[styles.tableCell, styles.colDetails]}>{t.details || "—"}</Text>
                                <Text style={[styles.tableCell, styles.colDebit]}>
                                    {t.type === "GAVE" ? t.amount.toFixed(2) : ""}
                                </Text>
                                <Text style={[styles.tableCell, styles.colCredit]}>
                                    {t.type === "GOT" ? t.amount.toFixed(2) : ""}
                                </Text>
                                <Text
                                    style={[
                                        styles.tableCell,
                                        styles.colBalance,
                                        t.runningBalance >= 0 ? styles.greenText : styles.redText,
                                    ]}
                                >
                                    {Math.abs(t.runningBalance).toFixed(2)} {t.runningBalance >= 0 ? "Dr" : "Cr"}
                                </Text>
                            </View>
                        </View>
                    )
                })}

                <View style={styles.tableFooter}>
                    <Text style={[styles.tableFooterCell, styles.colDate]} />
                    <Text style={[styles.tableFooterCell, styles.colDetails]}>Grand Total</Text>
                    <Text style={[styles.tableFooterCell, styles.colDebit]}>{totalDebit.toFixed(2)}</Text>
                    <Text style={[styles.tableFooterCell, styles.colCredit]}>{totalCredit.toFixed(2)}</Text>
                    <Text style={[styles.tableFooterCell, styles.colBalance]}>
                        {Math.abs(netBalance).toFixed(2)} {isGet ? "Dr" : "Cr"}
                    </Text>
                </View>

                <Text style={{ fontSize: 7.5, color: "#A0A0A0", marginTop: 16 }}>
                    Report Generated : {format(generatedAt, "hh:mm a")} | {format(generatedAt, "d MMM")}&apos;{format(generatedAt, "yy")}
                </Text>

                <View style={styles.pageFooter} fixed>
                    <Text style={styles.pageFooterText}>{businessName}</Text>
                    <Text
                        style={styles.pageFooterText}
                        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                    />
                </View>
            </Page>
        </Document>
    )
}
