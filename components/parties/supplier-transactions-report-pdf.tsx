import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { format } from "date-fns"
import type { AllSupplierTransactionRow } from "@/lib/actions/supplier-transactions"

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
    entryCount: { fontSize: 8, color: "#525252", marginBottom: 6 },
    tableHeader: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#0F0F0F",
        paddingBottom: 4,
        marginBottom: 2,
    },
    tableHeaderCell: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#0F0F0F", textTransform: "uppercase" },
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
    colDate: { width: "12%" },
    colName: { width: "22%" },
    colDetails: { width: "31%" },
    colDebit: { width: "17.5%", textAlign: "right" },
    colCredit: { width: "17.5%", textAlign: "right" },
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

interface SupplierTransactionsReportDocumentProps {
    businessName: string
    transactions: AllSupplierTransactionRow[]
    fromDate?: Date
    toDate?: Date
    generatedAt: Date
}

export function SupplierTransactionsReportDocument({
    businessName,
    transactions,
    fromDate,
    toDate,
    generatedAt,
}: SupplierTransactionsReportDocumentProps) {
    const totalGave = transactions.reduce((s, t) => s + (t.type === "GAVE" ? t.amount : 0), 0)
    const totalGot = transactions.reduce((s, t) => s + (t.type === "GOT" ? t.amount : 0), 0)
    const netBalance = totalGave - totalGot
    const isGet = netBalance > 0

    const dateRangeText =
        fromDate && toDate
            ? `(${format(fromDate, "d MMM yyyy")} - ${format(toDate, "d MMM yyyy")})`
            : "(All time)"

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.businessName}>{businessName}</Text>

                <Text style={styles.title}>Supplier Transactions Report</Text>
                <Text style={styles.subtitle}>{dateRangeText}</Text>

                <View style={styles.summaryBox}>
                    <View style={styles.summaryCell}>
                        <Text style={styles.summaryLabel}>You Gave</Text>
                        <Text style={[styles.summaryValue, styles.redText]}>
                            Rs.{totalGave.toLocaleString("en-IN")}
                        </Text>
                    </View>
                    <View style={styles.summaryCell}>
                        <Text style={styles.summaryLabel}>You Got</Text>
                        <Text style={[styles.summaryValue, styles.greenText]}>
                            Rs.{totalGot.toLocaleString("en-IN")}
                        </Text>
                    </View>
                    <View style={styles.summaryCell}>
                        <Text style={styles.summaryLabel}>Net Balance</Text>
                        <Text style={[styles.summaryValue, isGet ? styles.greenText : styles.redText]}>
                            Rs.{Math.abs(netBalance).toLocaleString("en-IN")} {isGet ? "Dr" : "Cr"}
                        </Text>
                    </View>
                </View>

                <Text style={styles.entryCount}>No. of Entries: {transactions.length}</Text>

                <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, styles.colDate]}>Date</Text>
                    <Text style={[styles.tableHeaderCell, styles.colName]}>Supplier</Text>
                    <Text style={[styles.tableHeaderCell, styles.colDetails]}>Details</Text>
                    <Text style={[styles.tableHeaderCell, styles.colDebit]}>You Gave</Text>
                    <Text style={[styles.tableHeaderCell, styles.colCredit]}>You Got</Text>
                </View>

                {transactions.map((t) => (
                    <View key={t.id} style={styles.tableRow}>
                        <Text style={[styles.tableCell, styles.colDate]}>{format(t.date, "d MMM yy")}</Text>
                        <Text style={[styles.tableCell, styles.colName]}>{t.partyName}</Text>
                        <Text style={[styles.tableCell, styles.colDetails]}>
                            {t.details || "—"}
                            {t.paymentMode ? `  (${t.paymentMode === "CASH" ? "Cash" : "Online"})` : ""}
                        </Text>
                        <Text style={[styles.tableCell, styles.colDebit, styles.redText]}>
                            {t.type === "GAVE" ? t.amount.toFixed(2) : ""}
                        </Text>
                        <Text style={[styles.tableCell, styles.colCredit, styles.greenText]}>
                            {t.type === "GOT" ? t.amount.toFixed(2) : ""}
                        </Text>
                    </View>
                ))}

                <View style={styles.tableFooter}>
                    <Text style={[styles.tableFooterCell, styles.colDate]} />
                    <Text style={[styles.tableFooterCell, styles.colName]} />
                    <Text style={[styles.tableFooterCell, styles.colDetails]}>Grand Total</Text>
                    <Text style={[styles.tableFooterCell, styles.colDebit]}>{totalGave.toFixed(2)}</Text>
                    <Text style={[styles.tableFooterCell, styles.colCredit]}>{totalGot.toFixed(2)}</Text>
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
