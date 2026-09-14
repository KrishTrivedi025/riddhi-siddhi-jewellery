"use client"

import { useState } from "react"
import { format } from "date-fns"
import { pdf } from "@react-pdf/renderer"
import { toast } from "sonner"
import { ChevronRight, Download, FileText, Loader2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { downloadOrSharePdf, describeSharePdfResult } from "@/lib/pdf-download"
import { SupplierListReportDocument } from "./supplier-list-report-pdf"
import { SupplierTransactionsReportPage } from "./supplier-transactions-report-page"
import { getAllSupplierTransactions } from "@/lib/actions/supplier-transactions"
import type { AllSupplierTransactionRow, SupplierKhataSummary } from "@/lib/actions/supplier-transactions"

interface SupplierListReportDialogProps {
    summary: SupplierKhataSummary
    trigger: React.ReactNode
}

export function SupplierListReportDialog({ summary, trigger }: SupplierListReportDialogProps) {
    const [menuOpen, setMenuOpen] = useState(false)
    const [reportPageOpen, setReportPageOpen] = useState(false)
    const [allTransactions, setAllTransactions] = useState<AllSupplierTransactionRow[] | null>(null)
    const [loadingTransactions, setLoadingTransactions] = useState(false)
    const [downloadingList, setDownloadingList] = useState(false)

    const openTransactionsPage = async () => {
        setMenuOpen(false)
        setReportPageOpen(true)
        if (allTransactions !== null) return
        setLoadingTransactions(true)
        try {
            const rows = await getAllSupplierTransactions()
            setAllTransactions(rows)
        } catch {
            toast.error("Failed to load transactions")
        } finally {
            setLoadingTransactions(false)
        }
    }

    const handleDownloadList = async () => {
        setDownloadingList(true)
        try {
            const doc = (
                <SupplierListReportDocument
                    businessName="Riddhi Siddhi Jewellery"
                    suppliers={summary.suppliers}
                    totalWillGive={summary.totalWillGive}
                    totalWillGet={summary.totalWillGet}
                    generatedAt={new Date()}
                />
            )
            const blob = await pdf(doc).toBlob()
            const filename = `Supplier_List_Report_${format(new Date(), "dd-MM-yyyy")}.pdf`
            const result = await downloadOrSharePdf(blob, filename)
            const diag = describeSharePdfResult(result)
            if (diag) {
                if (diag.type === "error") toast.error(diag.message)
                else toast.info(diag.message)
            } else {
                setMenuOpen(false)
            }
        } catch (err) {
            console.error("Supplier list PDF error:", err)
            toast.error("Failed to generate PDF")
        } finally {
            setDownloadingList(false)
        }
    }

    return (
        <>
            <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
                <DialogTrigger asChild>{trigger}</DialogTrigger>
                <DialogContent className="bg-card border-border text-foreground w-[95vw] max-w-lg rounded-2xl p-0 overflow-hidden gap-0">
                    <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
                        <DialogTitle className="text-lg font-bold">Reports</DialogTitle>
                    </DialogHeader>
                    <div className="p-2">
                        <button
                            type="button"
                            onClick={openTransactionsPage}
                            className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-muted transition-colors text-left"
                        >
                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <FileText size={18} className="text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground">Supplier Transactions Report</p>
                                <p className="text-xs text-muted-foreground">Summary of all supplier transactions</p>
                            </div>
                            <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                        </button>
                        <button
                            type="button"
                            onClick={handleDownloadList}
                            disabled={downloadingList}
                            className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-muted transition-colors text-left disabled:opacity-60"
                        >
                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                {downloadingList ? (
                                    <Loader2 size={18} className="text-primary animate-spin" />
                                ) : (
                                    <Download size={18} className="text-primary" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground">Supplier list pdf</p>
                                <p className="text-xs text-muted-foreground">List of all Suppliers</p>
                            </div>
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            <SupplierTransactionsReportPage
                open={reportPageOpen}
                onClose={() => {
                    setReportPageOpen(false)
                    setMenuOpen(true)
                }}
                transactions={allTransactions}
                loading={loadingTransactions}
            />
        </>
    )
}
