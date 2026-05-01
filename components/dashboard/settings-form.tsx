"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
    Building2, Shield, MapPin, Landmark, Save,
    Upload, Loader2, X, Image as ImageIcon, RefreshCw, LogOut,
} from "lucide-react"
import { updateBusinessProfile } from "@/lib/actions/setup"
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select"

const STATES = [
    "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
    "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra",
    "Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim",
    "Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
    "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli","Daman and Diu",
    "Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
]

const BUSINESS_TYPES = [
    "Jewellery Manufacturer","Jewellery Retailer","Jewellery Wholesaler",
    "Jewellery Exporter","Gems & Jewellery",
]

const TABS = [
    { id: "business", label: "Business", icon: Building2 },
    { id: "tax",      label: "Tax",      icon: Shield     },
    { id: "contact",  label: "Contact",  icon: MapPin     },
    { id: "bank",     label: "Bank",     icon: Landmark   },
]

interface SettingsFormProps {
    profile: {
        id: string
        businessName: string
        ownerName: string
        businessType: string
        gstin: string | null
        pan: string | null
        state: string | null
        address: string | null
        city: string | null
        pincode: string | null
        mobile: string | null
        email: string | null
        logoUrl: string | null
        signatureUrl: string | null
        invoicePrefix: string
        noGstInvoicePrefix: string | null
        termsConditions: string | null
        defaultBank?: {
            bankName: string | null
            accountName: string
            accountNumber: string | null
            ifscCode: string | null
            branchName: string | null
        } | null
    }
    signOutAction: () => Promise<void>
}

export default function SettingsForm({ profile, signOutAction }: SettingsFormProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState("business")
    const [saving, setSaving] = useState(false)
    const [verifyingIFSC, setVerifyingIFSC] = useState(false)
    const [uploadingLogo, setUploadingLogo] = useState(false)
    const [uploadingSig, setUploadingSig] = useState(false)
    const logoRef = useRef<HTMLInputElement>(null)
    const sigRef  = useRef<HTMLInputElement>(null)

    const [form, setForm] = useState({
        businessName:   profile.businessName,
        ownerName:      profile.ownerName,
        businessType:   profile.businessType,
        gstin:          profile.gstin || "",
        pan:            profile.pan || "",
        state:          profile.state || "Maharashtra",
        address:        profile.address || "",
        city:           profile.city || "",
        pincode:        profile.pincode || "",
        mobile:         profile.mobile || "",
        email:          profile.email || "",
        invoicePrefix:  profile.invoicePrefix,
        noGstInvoicePrefix: profile.noGstInvoicePrefix || "BILL",
        termsConditions:profile.termsConditions || "",
        bankName:       profile.defaultBank?.bankName || "",
        accountName:    profile.defaultBank?.accountName || "",
        accountNumber:  profile.defaultBank?.accountNumber || "",
        ifscCode:       profile.defaultBank?.ifscCode || "",
        branchName:     profile.defaultBank?.branchName || "",
    })

    const [logoPreview, setLogoPreview] = useState<string | null>(profile.logoUrl)
    const [sigPreview,  setSigPreview]  = useState<string | null>(profile.signatureUrl)
    const [logoUrl,     setLogoUrl]     = useState<string | null>(profile.logoUrl)
    const [sigUrl,      setSigUrl]      = useState<string | null>(profile.signatureUrl)

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

    const processImage = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = (e) => {
                const img = new Image()
                img.src = e.target?.result as string
                img.onload = () => {
                    const canvas = document.createElement("canvas")
                    const MAX = 400
                    let w = img.width, h = img.height
                    if (w > h) { if (w > MAX) { h *= MAX/w; w = MAX } }
                    else       { if (h > MAX) { w *= MAX/h; h = MAX } }
                    canvas.width = w; canvas.height = h
                    canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)
                    resolve(canvas.toDataURL("image/jpeg", 0.8))
                }
                img.onerror = reject
            }
            reader.onerror = reject
        })

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "signature") => {
        const file = e.target.files?.[0]
        if (!file) return
        type === "logo" ? setUploadingLogo(true) : setUploadingSig(true)
        try {
            const b64 = await processImage(file)
            if (type === "logo") { setLogoPreview(b64); setLogoUrl(b64) }
            else                 { setSigPreview(b64);  setSigUrl(b64)  }
            toast.success(`${type === "logo" ? "Logo" : "Signature"} uploaded!`)
        } catch { toast.error("Failed to process image") }
        finally { type === "logo" ? setUploadingLogo(false) : setUploadingSig(false) }
    }

    const handleVerifyIFSC = async () => {
        const code = form.ifscCode.trim().toUpperCase()
        if (code.length < 11) { toast.error("Enter valid 11-digit IFSC"); return }
        setVerifyingIFSC(true)
        try {
            const res = await fetch(`https://ifsc.razorpay.com/${code}`)
            if (res.ok) {
                const d = await res.json()
                setForm(p => ({ ...p, bankName: d.BANK||"", branchName: d.BRANCH||"" }))
                toast.success("Bank details fetched!")
            } else toast.error("Invalid IFSC code")
        } catch { toast.error("Network error") }
        finally { setVerifyingIFSC(false) }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const result = await updateBusinessProfile({
                id: profile.id, ...form,
                logoUrl: logoUrl || undefined,
                signatureUrl: sigUrl || undefined,
            })
            if (!result.success) throw new Error(result.error)
            toast.success("Settings saved!")
            router.refresh()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Save failed")
        } finally { setSaving(false) }
    }

    const I = "w-full bg-background border border-border rounded-xl px-3 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all text-sm"
    const L = "block text-[11px] text-muted-foreground mb-1 font-semibold uppercase tracking-wider"

    const ImageUploader = ({
        preview, uploading, onUpload, onRemove, inputRef, label, hint
    }: {
        preview: string|null, uploading: boolean,
        onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void,
        onRemove: () => void,
        inputRef: React.RefObject<HTMLInputElement | null>,
        label: string, hint: string
    }) => (
        <div>
            <label className={L}>{label}</label>
            <div
                onClick={() => inputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-4 cursor-pointer transition-all flex items-center gap-3 group"
            >
                {preview ? (
                    <>
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white border border-border flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={preview} alt={label} className="w-full h-full object-contain p-1" />
                            {uploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 size={14} className="animate-spin text-white" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-foreground text-sm font-medium">{uploading ? "Processing..." : "Uploaded"}</p>
                            <p className="text-muted-foreground text-xs">Tap to replace</p>
                        </div>
                        <div className="flex gap-1.5">
                            <button onClick={e => { e.stopPropagation(); inputRef.current?.click() }} className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-primary transition-colors">
                                <RefreshCw size={13} />
                            </button>
                            <button onClick={e => { e.stopPropagation(); onRemove() }} className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-rose-400 transition-colors">
                                <X size={13} />
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                            <ImageIcon size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-foreground font-medium">Upload {label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
                        </div>
                        <Upload size={15} className="text-muted-foreground flex-shrink-0" />
                    </>
                )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
        </div>
    )

    return (
        <div className="max-w-2xl mx-auto space-y-4">

            {/* ── Header ── */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-foreground">Business Settings</h1>
                    <p className="text-muted-foreground text-xs mt-0.5">Manage profile, tax &amp; invoice branding</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all disabled:opacity-60 shadow-lg shadow-primary/20 flex-shrink-0"
                >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save
                </button>
            </div>

            {/* ── Profile Preview ── */}
            <div className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                    {logoPreview
                        ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                        : <span className="text-2xl">💎</span>
                    }
                </div>
                <div className="min-w-0 flex-1">
                    <h2 className="text-foreground font-bold text-base truncate">{form.businessName}</h2>
                    <p className="text-muted-foreground text-xs">{form.businessType}</p>
                    {form.gstin && <p className="text-[11px] text-primary font-medium mt-0.5">GST: {form.gstin}</p>}
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">

                {/* Tab bar — scrollable on mobile */}
                <div className="flex border-b border-border overflow-x-auto scrollbar-none">
                    {TABS.map(tab => {
                        const Icon = tab.icon
                        const active = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
                                    active
                                        ? "border-primary text-primary bg-primary/5"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <Icon size={13} />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>

                {/* Tab content */}
                <div className="p-4 space-y-4">

                    {/* ── Business Tab ── */}
                    {activeTab === "business" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={L}>Business Name *</label>
                                    <input value={form.businessName} onChange={e => set("businessName", e.target.value)} className={I} />
                                </div>
                                <div>
                                    <label className={L}>Owner Name *</label>
                                    <input value={form.ownerName} onChange={e => set("ownerName", e.target.value)} className={I} />
                                </div>
                            </div>
                            <div>
                                <label className={L}>Business Type</label>
                                <Select value={form.businessType} onValueChange={v => set("businessType", v)}>
                                    <SelectTrigger className={I}><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-card border-border text-foreground">
                                        {BUSINESS_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <ImageUploader
                                preview={logoPreview} uploading={uploadingLogo}
                                onUpload={e => handleImageSelect(e, "logo")}
                                onRemove={() => { setLogoPreview(null); setLogoUrl(null) }}
                                inputRef={logoRef}
                                label="Business Logo"
                                hint="PNG, JPG up to 2MB"
                            />
                        </motion.div>
                    )}

                    {/* ── Tax Tab ── */}
                    {activeTab === "tax" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={L}>GSTIN</label>
                                    <input value={form.gstin} onChange={e => set("gstin", e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" maxLength={15} className={I} />
                                </div>
                                <div>
                                    <label className={L}>PAN Number</label>
                                    <input value={form.pan} onChange={e => set("pan", e.target.value.toUpperCase())} placeholder="AAAAA0000A" maxLength={10} className={I} />
                                </div>
                            </div>
                            <div>
                                <label className={L}>State *</label>
                                <Select value={form.state} onValueChange={v => set("state", v)}>
                                    <SelectTrigger className={I}><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-card border-border text-foreground max-h-64">
                                        {STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="bg-primary/5 rounded-xl p-3 border border-primary/15">
                                <p className="text-muted-foreground text-xs">💡 Your state determines CGST+SGST vs IGST on invoices.</p>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Contact Tab ── */}
                    {activeTab === "contact" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            <div>
                                <label className={L}>Full Address *</label>
                                <textarea value={form.address} onChange={e => set("address", e.target.value)} rows={2} className={`${I} resize-none`} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={L}>City *</label>
                                    <input value={form.city} onChange={e => set("city", e.target.value)} className={I} />
                                </div>
                                <div>
                                    <label className={L}>Pincode *</label>
                                    <input value={form.pincode} onChange={e => set("pincode", e.target.value)} maxLength={6} className={I} />
                                </div>
                            </div>
                            <div>
                                <label className={L}>State</label>
                                <input value={form.state} readOnly className={`${I} opacity-60`} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className={L}>Mobile *</label>
                                    <input value={form.mobile} onChange={e => set("mobile", e.target.value)} className={I} />
                                </div>
                                <div>
                                    <label className={L}>Email</label>
                                    <input value={form.email} type="email" onChange={e => set("email", e.target.value)} className={I} />
                                </div>
                            </div>

                            {/* Signature upload — moved here */}
                            <div className="pt-2 border-t border-border">
                                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">Invoice Signature</p>
                                <ImageUploader
                                    preview={sigPreview} uploading={uploadingSig}
                                    onUpload={e => handleImageSelect(e, "signature")}
                                    onRemove={() => { setSigPreview(null); setSigUrl(null) }}
                                    inputRef={sigRef}
                                    label="Authorised Signature"
                                    hint="PNG with transparent background preferred"
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* ── Bank Tab ── */}
                    {activeTab === "bank" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Default Bank (shown on invoices)</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={L}>Account Holder Name *</label>
                                    <input value={form.accountName} onChange={e => set("accountName", e.target.value)} className={I} />
                                </div>
                                <div>
                                    <label className={L}>Bank Name</label>
                                    <input value={form.bankName} onChange={e => set("bankName", e.target.value)} placeholder="HDFC Bank" className={I} />
                                </div>
                            </div>
                            <div>
                                <label className={L}>Account Number *</label>
                                <input value={form.accountNumber} onChange={e => set("accountNumber", e.target.value)} className={I} />
                            </div>
                            <div>
                                <label className={L}>IFSC Code *</label>
                                <div className="flex gap-2">
                                    <input value={form.ifscCode} onChange={e => set("ifscCode", e.target.value.toUpperCase())} placeholder="SBIN0000691" maxLength={11} className={I} />
                                    <button type="button" onClick={handleVerifyIFSC} disabled={verifyingIFSC}
                                        className="px-4 bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-all font-semibold text-xs flex-shrink-0">
                                        {verifyingIFSC ? <Loader2 size={13} className="animate-spin" /> : "Verify"}
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={L}>Branch</label>
                                    <input value={form.branchName} onChange={e => set("branchName", e.target.value)} className={I} />
                                </div>
                                <div>
                                    <label className={L}>Invoice Prefix</label>
                                    <input value={form.invoicePrefix} onChange={e => set("invoicePrefix", e.target.value.toUpperCase())} className={I} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={L}>Invoice Prefix (without GST bill)</label>
                                    <input
                                        value={form.noGstInvoicePrefix}
                                        onChange={e => set("noGstInvoicePrefix", e.target.value.toUpperCase())}
                                        placeholder="BILL"
                                        className={I}
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-1">Used for bills without GST</p>
                                </div>
                            </div>
                            <div>
                                <label className={L}>Default Terms & Conditions</label>
                                <textarea value={form.termsConditions} onChange={e => set("termsConditions", e.target.value)} rows={3} className={`${I} resize-none`} placeholder="Enter your business terms..." />
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* ── Sign Out ── */}
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div>
                    <h3 className="text-rose-500 font-semibold text-sm">Sign out of Dashboard</h3>
                    <p className="text-muted-foreground text-xs mt-0.5">You will be required to log in again.</p>
                </div>
                <form action={signOutAction}>
                    <button type="submit"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 font-semibold transition-all text-sm flex-shrink-0">
                        <LogOut size={15} /> Sign Out
                    </button>
                </form>
            </div>

        </div>
    )
}