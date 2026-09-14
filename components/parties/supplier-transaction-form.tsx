"use client"

import { useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog as DialogPrimitive } from "radix-ui"
import { format } from "date-fns"
import { toast } from "sonner"
import { ChevronLeft, FileText, ImagePlus, Loader2, Paperclip, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useConfirm } from "@/components/shared/confirm-provider"
import { useTrackDirty } from "@/lib/hooks/use-unsaved-changes"
import { createSupplierTransaction, updateSupplierTransaction } from "@/lib/actions/supplier-transactions"
import { supplierTransactionSchema, type SupplierTransactionFormValues } from "@/lib/schemas/supplier-transaction-schema"
import type { SupplierTransactionType, SupplierTransactionWithBalance } from "@/lib/actions/supplier-transactions"
import { cn } from "@/lib/utils"

interface AttachmentItem {
    url: string
    fileName: string
    fileType: "image" | "pdf"
    uploading?: boolean
}

interface SupplierTransactionFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    partyId: string
    partyName: string
    type: SupplierTransactionType
    editing?: SupplierTransactionWithBalance | null
    onSaved: (info: { type: SupplierTransactionType; amount: number; isEdit: boolean }) => void
}

export function SupplierTransactionForm({
    open,
    onOpenChange,
    partyId,
    partyName,
    type,
    editing,
    onSaved,
}: SupplierTransactionFormProps) {
    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay
                    className="fixed inset-0 z-50 bg-black/50 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
                />
                <DialogPrimitive.Content
                    data-slot="dialog-content"
                    onPointerDownOutside={(e) => e.preventDefault()}
                    className="fixed inset-0 z-50 bg-background flex flex-col outline-none data-open:animate-in data-open:slide-in-from-bottom-4 data-open:duration-250 data-closed:animate-out data-closed:slide-out-to-bottom-2 data-closed:duration-150"
                >
                    <DialogPrimitive.Title className="sr-only">
                        {type === "GAVE" ? "Record what you gave" : "Record what you got"}
                    </DialogPrimitive.Title>
                    <FormBody
                        partyId={partyId}
                        partyName={partyName}
                        type={type}
                        editing={editing}
                        onOpenChange={onOpenChange}
                        onSaved={onSaved}
                    />
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}

function FormBody({
    partyId,
    partyName,
    type,
    editing,
    onOpenChange,
    onSaved,
}: {
    partyId: string
    partyName: string
    type: SupplierTransactionType
    editing?: SupplierTransactionWithBalance | null
    onOpenChange: (open: boolean) => void
    onSaved: (info: { type: SupplierTransactionType; amount: number; isEdit: boolean }) => void
}) {
    const confirm = useConfirm()
    const photoInputRef = useRef<HTMLInputElement>(null)
    const pdfInputRef = useRef<HTMLInputElement>(null)

    const initialAttachments: AttachmentItem[] = (editing?.attachments || []).map((a) => ({
        url: a.url,
        fileName: a.fileName,
        fileType: a.fileType as "image" | "pdf",
    }))
    const [attachments, setAttachments] = useState<AttachmentItem[]>(initialAttachments)

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isDirty, isSubmitting },
    } = useForm<SupplierTransactionFormValues>({
        resolver: zodResolver(supplierTransactionSchema),
        defaultValues: {
            partyId,
            type,
            amount: editing?.amount,
            details: editing?.details ?? "",
            date: (editing
                ? format(editing.date, "yyyy-MM-dd")
                : format(new Date(), "yyyy-MM-dd")) as unknown as Date,
            attachments: [],
        },
    })

    const attachmentsDirty =
        attachments.length !== initialAttachments.length ||
        attachments.some((a, i) => a.url !== initialAttachments[i]?.url)
    const formIsDirty = isDirty || attachmentsDirty
    useTrackDirty(formIsDirty)

    const amountValue = watch("amount")
    const displayAmount =
        Number.isFinite(amountValue) && amountValue > 0
            ? amountValue.toLocaleString("en-IN")
            : "0"

    const requestClose = async () => {
        if (formIsDirty) {
            const ok = await confirm({
                title: "Discard changes?",
                description: "You have unsaved changes. Going back will lose them.",
                confirmText: "Discard",
                cancelText: "Keep Editing",
                variant: "destructive",
            })
            if (!ok) return
        }
        onOpenChange(false)
    }

    const uploading = attachments.some((a) => a.uploading)

    const handleFileSelect = async (file: File, fileType: "image" | "pdf") => {
        if (attachments.length >= 4) return
        const tempId = `${Date.now()}-${file.name}`
        setAttachments((prev) => [...prev, { url: tempId, fileName: file.name, fileType, uploading: true }])

        try {
            const formData = new FormData()
            formData.append("file", file)
            const res = await fetch("/api/upload/supplier-attachment", { method: "POST", body: formData })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || "Upload failed")

            setAttachments((prev) =>
                prev.map((a) =>
                    a.url === tempId ? { url: json.url, fileName: json.fileName, fileType: json.fileType } : a
                )
            )
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Upload failed")
            setAttachments((prev) => prev.filter((a) => a.url !== tempId))
        }
    }

    const removeAttachment = (url: string) => {
        setAttachments((prev) => prev.filter((a) => a.url !== url))
    }

    const onSubmit = async (values: SupplierTransactionFormValues) => {
        if (uploading) {
            toast.error("Please wait for attachments to finish uploading")
            return
        }
        const payload: SupplierTransactionFormValues = {
            partyId,
            type,
            amount: values.amount,
            details: values.details || null,
            date: values.date,
            attachments: attachments.map((a) => ({ url: a.url, fileName: a.fileName, fileType: a.fileType })),
        }
        const result = editing
            ? await updateSupplierTransaction(editing.id, payload)
            : await createSupplierTransaction(payload)

        if (result.success) {
            onSaved({ type, amount: values.amount, isEdit: !!editing })
        } else {
            toast.error(result.error)
        }
    }

    const isGave = type === "GAVE"

    return (
        <>
            <div
                className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0"
                style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}
            >
                <button
                    type="button"
                    onClick={requestClose}
                    className="p-1.5 -ml-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>
                <h2 className={cn("text-base font-bold truncate", isGave ? "text-rose-600" : "text-emerald-600")}>
                    You {isGave ? "gave" : "got"} ₹{displayAmount} {isGave ? "to" : "from"} {partyName}
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-4 space-y-4">
                <div className="rounded-xl border-2 border-border focus-within:border-primary bg-card px-4 py-3 flex items-center gap-2">
                    <span className="text-2xl font-bold text-muted-foreground">₹</span>
                    <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        placeholder="Enter amount"
                        autoFocus
                        className="flex-1 min-w-0 bg-transparent text-2xl font-bold text-foreground outline-none placeholder:text-muted-foreground placeholder:font-normal placeholder:text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        {...register("amount", {
                            setValueAs: (v) => (v === "" || v === null || v === undefined ? NaN : parseFloat(v)),
                        })}
                    />
                </div>
                {errors.amount && <p className="text-xs text-destructive -mt-2">{errors.amount.message}</p>}

                <textarea
                    placeholder="Enter details (Items, bill no., quantity, etc.)"
                    rows={2}
                    className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30 resize-none dark:bg-card/30"
                    {...register("details")}
                />

                <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Date</label>
                    <Input
                        type="date"
                        max={format(new Date(), "yyyy-MM-dd")}
                        className="max-w-[180px] bg-background border-border text-foreground"
                        {...register("date" as any)}
                    />
                </div>

                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Attach bills (max 4)</p>
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {attachments.map((a) => (
                                <div
                                    key={a.url}
                                    className="relative h-16 w-16 rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center shrink-0"
                                >
                                    {a.uploading ? (
                                        <Loader2 size={16} className="animate-spin text-muted-foreground" />
                                    ) : a.fileType === "image" ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={a.url} alt={a.fileName} className="h-full w-full object-cover" />
                                    ) : (
                                        <FileText size={20} className="text-muted-foreground" />
                                    )}
                                    {!a.uploading && (
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(a.url)}
                                            className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-black/60 text-white flex items-center justify-center"
                                        >
                                            <X size={10} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={attachments.length >= 4}
                            onClick={() => photoInputRef.current?.click()}
                            className="gap-1.5"
                        >
                            <ImagePlus size={14} /> Add photo
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={attachments.length >= 4}
                            onClick={() => pdfInputRef.current?.click()}
                            className="gap-1.5"
                        >
                            <Paperclip size={14} /> Add PDF
                        </Button>
                    </div>
                    <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileSelect(file, "image")
                            e.target.value = ""
                        }}
                    />
                    <input
                        ref={pdfInputRef}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileSelect(file, "pdf")
                            e.target.value = ""
                        }}
                    />
                </div>
            </form>

                <div
                    className="px-4 pt-2"
                    style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
                >
                    <Button
                        type="button"
                        onClick={handleSubmit(onSubmit)}
                        disabled={isSubmitting || uploading}
                        className={cn(
                            "w-full font-bold text-white",
                            isGave ? "bg-rose-600 hover:bg-rose-600/90" : "bg-emerald-600 hover:bg-emerald-600/90"
                        )}
                    >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "SAVE"}
                    </Button>
                </div>
            </div>
        </>
    )
}
