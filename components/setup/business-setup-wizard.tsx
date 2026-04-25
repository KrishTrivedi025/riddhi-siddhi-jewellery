"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
    Building2, Shield, MapPin, Landmark,
    Upload, CheckCircle2, ChevronRight, ChevronLeft,
    Loader2, X, Image as ImageIcon,
} from "lucide-react"
import { createBusinessSetup, type SetupFormData } from "@/lib/actions/setup"

const STEPS = [
    { id: 1, title: "Business Identity", subtitle: "Who are you?", icon: Building2 },
    { id: 2, title: "Tax & Legal",       subtitle: "GST & PAN details", icon: Shield },
    { id: 3, title: "Contact & Address", subtitle: "Where are you?", icon: MapPin },
    { id: 4, title: "Bank & Invoice",    subtitle: "Payment & branding", icon: Landmark },
]

const STATES = [
    "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
    "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra",
    "Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim",
    "Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
    "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli","Daman and Diu",
    "Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
]

const BUSINESS_TYPES = [
    "Jewellery Manufacturer",
    "Jewellery Retailer",
    "Jewellery Wholesaler",
    "Jewellery Exporter",
    "Gems & Jewellery",
]

interface UploadedImage { url: string; preview: string }

export default function BusinessSetupWizard() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [logoImg, setLogoImg] = useState<UploadedImage | null>(null)
    const [sigImg, setSigImg] = useState<UploadedImage | null>(null)
    const logoRef = useRef<HTMLInputElement>(null)
    const sigRef = useRef<HTMLInputElement>(null)

    const [form, setForm] = useState<Omit<SetupFormData, "logoUrl" | "signatureUrl">>({
        businessName: "",
        ownerName: "",
        businessType: "Jewellery Manufacturer",
        gstin: "",
        pan: "",
        state: "Maharashtra",
        address: "",
        city: "",
        pincode: "",
        mobile: "",
        email: "",
        bankName: "",
        accountName: "",
        accountNumber: "",
        ifscCode: "",
        branchName: "",
        invoicePrefix: "INV",
        termsConditions: "1. Our risk & responsibility ceases as soon as goods leave our premises.\n2. Interest at 18% will be charged from the due date of payment.\n3. Goods sold once will not be taken back.",
    })

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

    const uploadImage = async (file: File, type: "logo" | "signature") => {
        const fd = new FormData()
        fd.append("file", file)
        fd.append("type", type)
        const res = await fetch("/api/upload", { method: "POST", body: fd })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || "Upload failed")
        return json.url as string
    }

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "signature") => {
        const file = e.target.files?.[0]
        if (!file) return
        const preview = URL.createObjectURL(file)
        const setter = type === "logo" ? setLogoImg : setSigImg
        setter({ url: "", preview })
        try {
            const url = await uploadImage(file, type)
            setter({ url, preview })
            toast.success(`${type === "logo" ? "Logo" : "Signature"} uploaded!`)
        } catch {
            setter(null)
            toast.error("Upload failed. Please try again.")
        }
    }

    const validateStep = () => {
        if (step === 1 && (!form.businessName || !form.ownerName)) {
            toast.error("Business name and owner name are required"); return false
        }
        if (step === 3 && (!form.address || !form.city || !form.pincode || !form.mobile)) {
            toast.error("All contact fields are required"); return false
        }
        if (step === 4 && (!form.bankName || !form.accountName || !form.accountNumber || !form.ifscCode)) {
            toast.error("Bank details are required"); return false
        }
        return true
    }

    const handleSubmit = async () => {
        if (!validateStep()) return
        setLoading(true)
        try {
            const result = await createBusinessSetup({
                ...form,
                logoUrl: logoImg?.url || undefined,
                signatureUrl: sigImg?.url || undefined,
            })
            if (!result.success) throw new Error(result.error)
            toast.success("Business profile created! Welcome to Riddhi Siddhi 🎉")
            router.push("/dashboard")
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Setup failed")
        } finally {
            setLoading(false)
        }
    }

    const InputClass = "w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all text-sm"
    const LabelClass = "block text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide"

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            {/* Background glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
            </div>

            <div className="w-full max-w-2xl relative">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl">💎</div>
                        <div className="text-left">
                            <p className="text-foreground font-bold text-lg leading-tight">Welcome!</p>
                            <p className="text-muted-foreground text-sm">Let's set up your business</p>
                        </div>
                    </div>
                </motion.div>

                {/* Step Progress */}
                <div className="flex items-center gap-2 mb-8 px-2">
                    {STEPS.map((s, i) => {
                        const Icon = s.icon
                        const done = step > s.id
                        const active = step === s.id
                        return (
                            <div key={s.id} className="flex items-center flex-1">
                                <div className={`flex flex-col items-center gap-1 flex-1`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${
                                        done    ? "bg-primary border-primary text-primary-foreground"
                                        : active ? "bg-primary/10 border-primary text-primary"
                                                 : "bg-card border-border text-muted-foreground"
                                    }`}>
                                        {done ? <CheckCircle2 size={18} /> : <Icon size={16} />}
                                    </div>
                                    <span className={`text-[10px] font-medium hidden sm:block ${active ? "text-primary" : done ? "text-muted-foreground" : "text-muted-foreground"}`}>
                                        {s.title}
                                    </span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`h-px flex-1 mx-1 ${step > s.id ? "bg-primary/50" : "bg-border"}`} />
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Card */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    {/* Card Header */}
                    <div className="px-8 py-5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
                        <div className="flex items-center gap-3">
                            {(() => { const Icon = STEPS[step - 1].icon; return <Icon size={20} className="text-primary" /> })()}
                            <div>
                                <h2 className="text-foreground font-semibold">{STEPS[step - 1].title}</h2>
                                <p className="text-muted-foreground text-xs">{STEPS[step - 1].subtitle}</p>
                            </div>
                            <span className="ml-auto text-muted-foreground text-sm">Step {step} of {STEPS.length}</span>
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="p-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* ── STEP 1 ─────────────────────────────── */}
                                {step === 1 && (
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div>
                                                <label className={LabelClass}>Business Name <span className="text-primary">*</span></label>
                                                <input value={form.businessName} onChange={e => set("businessName", e.target.value)}
                                                    placeholder="Riddhi Siddhi Jewellery" className={InputClass} />
                                            </div>
                                            <div>
                                                <label className={LabelClass}>Owner Name <span className="text-primary">*</span></label>
                                                <input value={form.ownerName} onChange={e => set("ownerName", e.target.value)}
                                                    placeholder="Your full name" className={InputClass} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={LabelClass}>Business Type</label>
                                            <select value={form.businessType} onChange={e => set("businessType", e.target.value)}
                                                className={InputClass}>
                                                {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        {/* Logo Upload */}
                                        <div>
                                            <label className={LabelClass}>Business Logo</label>
                                            <div
                                                onClick={() => logoRef.current?.click()}
                                                className="border-2 border-dashed border-border hover:border-primary/40 rounded-xl p-6 cursor-pointer transition-colors flex items-center gap-4"
                                            >
                                                {logoImg ? (
                                                    <>
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={logoImg.preview} alt="Logo" className="w-16 h-16 rounded-lg object-contain bg-background" />
                                                        <div>
                                                            <p className="text-foreground text-sm font-medium">Logo uploaded</p>
                                                            <p className="text-muted-foreground text-xs mt-0.5">Click to change</p>
                                                        </div>
                                                        <button onClick={e => { e.stopPropagation(); setLogoImg(null) }} className="ml-auto text-muted-foreground hover:text-[#EF4444]">
                                                            <X size={16} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center">
                                                            <ImageIcon size={20} className="text-muted-foreground" />
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground text-sm">Click to upload logo</p>
                                                            <p className="text-muted-foreground text-xs mt-0.5">PNG, JPG up to 2MB</p>
                                                        </div>
                                                        <Upload size={16} className="ml-auto text-muted-foreground" />
                                                    </>
                                                )}
                                            </div>
                                            <input ref={logoRef} type="file" accept="image/*" className="hidden"
                                                onChange={e => handleImageSelect(e, "logo")} />
                                        </div>
                                    </div>
                                )}

                                {/* ── STEP 2 ─────────────────────────────── */}
                                {step === 2 && (
                                    <div className="space-y-5">
                                        <div>
                                            <label className={LabelClass}>GSTIN</label>
                                            <input value={form.gstin} onChange={e => set("gstin", e.target.value.toUpperCase())}
                                                placeholder="22AAAAA0000A1Z5" maxLength={15} className={InputClass} />
                                            <p className="text-muted-foreground text-xs mt-1.5">15-digit GST Identification Number</p>
                                        </div>
                                        <div>
                                            <label className={LabelClass}>PAN Number <span className="text-primary">*</span></label>
                                            <input value={form.pan} onChange={e => set("pan", e.target.value.toUpperCase())}
                                                placeholder="AAAAA0000A" maxLength={10} className={InputClass} />
                                        </div>
                                        <div>
                                            <label className={LabelClass}>State <span className="text-primary">*</span></label>
                                            <select value={form.state} onChange={e => set("state", e.target.value)} className={InputClass}>
                                                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div className="bg-background rounded-xl p-4 border border-border">
                                            <p className="text-muted-foreground text-xs">💡 Your state is used to determine CGST+SGST (intra-state) vs IGST (inter-state) tax calculation on invoices.</p>
                                        </div>
                                    </div>
                                )}

                                {/* ── STEP 3 ─────────────────────────────── */}
                                {step === 3 && (
                                    <div className="space-y-5">
                                        <div>
                                            <label className={LabelClass}>Full Address <span className="text-primary">*</span></label>
                                            <textarea value={form.address} onChange={e => set("address", e.target.value)}
                                                placeholder="Shop No., Building, Street, Area..." rows={2}
                                                className={`${InputClass} resize-none`} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={LabelClass}>City <span className="text-primary">*</span></label>
                                                <input value={form.city} onChange={e => set("city", e.target.value)}
                                                    placeholder="Mumbai" className={InputClass} />
                                            </div>
                                            <div>
                                                <label className={LabelClass}>Pincode <span className="text-primary">*</span></label>
                                                <input value={form.pincode} onChange={e => set("pincode", e.target.value)}
                                                    placeholder="400001" maxLength={6} className={InputClass} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={LabelClass}>Mobile <span className="text-primary">*</span></label>
                                                <input value={form.mobile} onChange={e => set("mobile", e.target.value)}
                                                    placeholder="+91 9920345963" className={InputClass} />
                                            </div>
                                            <div>
                                                <label className={LabelClass}>Email</label>
                                                <input value={form.email} onChange={e => set("email", e.target.value)}
                                                    type="email" placeholder="business@example.com" className={InputClass} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── STEP 4 ─────────────────────────────── */}
                                {step === 4 && (
                                    <div className="space-y-5">
                                        <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium">Bank Account Details</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={LabelClass}>Account Holder Name <span className="text-primary">*</span></label>
                                                <input value={form.accountName} onChange={e => set("accountName", e.target.value)}
                                                    placeholder="Riddhi Siddhi Jewellery" className={InputClass} />
                                            </div>
                                            <div>
                                                <label className={LabelClass}>Bank Name <span className="text-primary">*</span></label>
                                                <input value={form.bankName} onChange={e => set("bankName", e.target.value)}
                                                    placeholder="HDFC Bank" className={InputClass} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={LabelClass}>Account Number <span className="text-primary">*</span></label>
                                                <input value={form.accountNumber} onChange={e => set("accountNumber", e.target.value)}
                                                    placeholder="50200053602103" className={InputClass} />
                                            </div>
                                            <div>
                                                <label className={LabelClass}>IFSC Code <span className="text-primary">*</span></label>
                                                <input value={form.ifscCode} onChange={e => set("ifscCode", e.target.value.toUpperCase())}
                                                    placeholder="HDFC0001024" className={InputClass} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={LabelClass}>Branch Name</label>
                                                <input value={form.branchName} onChange={e => set("branchName", e.target.value)}
                                                    placeholder="Bhayandar West" className={InputClass} />
                                            </div>
                                            <div>
                                                <label className={LabelClass}>Invoice Prefix</label>
                                                <input value={form.invoicePrefix} onChange={e => set("invoicePrefix", e.target.value.toUpperCase())}
                                                    placeholder="INV" maxLength={6} className={InputClass} />
                                            </div>
                                        </div>

                                        {/* Signature Upload */}
                                        <div>
                                            <label className={LabelClass}>Authorised Signature</label>
                                            <div onClick={() => sigRef.current?.click()}
                                                className="border-2 border-dashed border-border hover:border-primary/40 rounded-xl p-5 cursor-pointer transition-colors flex items-center gap-4">
                                                {sigImg ? (
                                                    <>
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={sigImg.preview} alt="Signature" className="h-12 max-w-[120px] object-contain bg-white rounded p-1" />
                                                        <div>
                                                            <p className="text-foreground text-sm font-medium">Signature uploaded</p>
                                                            <p className="text-muted-foreground text-xs mt-0.5">Click to change</p>
                                                        </div>
                                                        <button onClick={e => { e.stopPropagation(); setSigImg(null) }} className="ml-auto text-muted-foreground hover:text-[#EF4444]">
                                                            <X size={16} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="w-12 h-10 rounded-xl bg-background flex items-center justify-center">
                                                            <ImageIcon size={18} className="text-muted-foreground" />
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground text-sm">Upload your signature</p>
                                                            <p className="text-muted-foreground text-xs mt-0.5">Appears on invoices — PNG with transparent bg preferred</p>
                                                        </div>
                                                        <Upload size={16} className="ml-auto text-muted-foreground" />
                                                    </>
                                                )}
                                            </div>
                                            <input ref={sigRef} type="file" accept="image/*" className="hidden"
                                                onChange={e => handleImageSelect(e, "signature")} />
                                        </div>

                                        <div>
                                            <label className={LabelClass}>Default Terms & Conditions</label>
                                            <textarea value={form.termsConditions} onChange={e => set("termsConditions", e.target.value)}
                                                rows={3} placeholder="Enter your terms..." className={`${InputClass} resize-none`} />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-5 border-t border-border flex items-center justify-between">
                        <button
                            onClick={() => setStep(s => s - 1)}
                            disabled={step === 1}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft size={16} /> Previous
                        </button>

                        {step < STEPS.length ? (
                            <button
                                onClick={() => { if (validateStep()) setStep(s => s + 1) }}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all disabled:opacity-60"
                            >
                                {loading ? <><Loader2 size={16} className="animate-spin" /> Setting up...</> : <><CheckCircle2 size={16} /> Complete Setup</>}
                            </button>
                        )}
                    </div>
                </div>

                <p className="text-center text-muted-foreground text-xs mt-6">
                    You can update all details later from ⚙️ Settings
                </p>
            </div>
        </div>
    )
}
