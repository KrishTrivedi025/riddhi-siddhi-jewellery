import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { format } from "date-fns"
import type { SupplierKhataSummaryItem } from "@/lib/actions/supplier-transactions"

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
        padding: "5 6",
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    tableCell: { fontSize: 8.5, color: "#1A1A1A" },
    tableFooter: {
        flexDirection: "row",
        backgroundColor: "#F8F8F8",
        padding: "6 6",
        borderTopWidth: 1,
        borderTopColor: "#0F0F0F",
        marginTop: 2,
    },
    tableFooterCell: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#0F0F0F" },
    colName: { width: "30%" },
    colDetails: { width: "30%" },
    colGet: { width: "20%", textAlign: "right" },
    colGive: { width: "20%", textAlign: "right" },
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

interface SupplierListReportDocumentProps {
    businessName: string
    suppliers: SupplierKhataSummaryItem[]
    totalWillGive: number
    totalWillGet: number
    generatedAt: Date
}

export function SupplierListReportDocument({
    businessName,
    suppliers,
    totalWillGive,
    totalWillGet,
    generatedAt,
}: SupplierListReportDocumentProps) {
    const netBalance = totalWillGet - totalWillGive
    const isGet = netBalance >= 0

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.businessName}>{businessName}</Text>

                <Text style={styles.title}>Supplier List Report</Text>
                <Text style={styles.subtitle}>(As of Today - {format(generatedAt, "d MMMM yyyy")})</Text>

                <View style={styles.summaryBox}>
                    <View style={styles.summaryCell}>
                        <Text style={styles.summaryLabel}>You&apos;ll Get</Text>
                        <Text style={[styles.summaryValue, styles.greenText]}>
                            Rs.{totalWillGet.toLocaleString("en-IN")}
                        </Text>
                    </View>
                    <View style={styles.summaryCell}>
                        <Text style={styles.summaryLabel}>You&apos;ll Give</Text>
                        <Text style={[styles.summaryValue, styles.redText]}>
                            Rs.{totalWillGive.toLocaleString("en-IN")}
                        </Text>
                    </View>
                    <View style={styles.summaryCell}>
                        <Text style={styles.summaryLabel}>Net Balance</Text>
                        <Text style={[styles.summaryValue, isGet ? styles.greenText : styles.redText]}>
                            Rs.{Math.abs(netBalance).toLocaleString("en-IN")} {isGet ? "Cr" : "Dr"}
                        </Text>
                    </View>
                </View>

                <Text style={styles.entryCount}>No. of Suppliers: {suppliers.length} (All)</Text>

                <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, styles.colName]}>Name</Text>
                    <Text style={[styles.tableHeaderCell, styles.colDetails]}>Details</Text>
                    <Text style={[styles.tableHeaderCell, styles.colGet]}>You&apos;ll Get</Text>
                    <Text style={[styles.tableHeaderCell, styles.colGive]}>You&apos;ll Give</Text>
                </View>

                {suppliers.map((s) => (
                    <View key={s.id} style={styles.tableRow}>
                        <Text style={[styles.tableCell, styles.colName]}>{s.name}</Text>
                        <Text style={[styles.tableCell, styles.colDetails]}>{s.phone || ""}</Text>
                        <Text style={[styles.tableCell, styles.colGet, styles.greenText]}>
                            {s.netBalance > 0 ? s.netBalance.toFixed(2) : ""}
                        </Text>
                        <Text style={[styles.tableCell, styles.colGive, styles.redText]}>
                            {s.netBalance < 0 ? Math.abs(s.netBalance).toFixed(2) : ""}
                        </Text>
                    </View>
                ))}

                <View style={styles.tableFooter}>
                    <Text style={[styles.tableFooterCell, styles.colName]} />
                    <Text style={[styles.tableFooterCell, styles.colDetails]}>Grand Total</Text>
                    <Text style={[styles.tableFooterCell, styles.colGet]}>{totalWillGet.toFixed(2)}</Text>
                    <Text style={[styles.tableFooterCell, styles.colGive]}>{totalWillGive.toFixed(2)}</Text>
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
