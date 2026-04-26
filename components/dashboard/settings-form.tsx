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

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const TABS = [
    { id: "business", label: "Business", icon: Building2 },
    { id: "tax",      label: "Tax & Legal", icon: Shield },
    { id: "contact",  label: "Contact", icon: MapPin },
    { id: "bank",     label: "Bank & Invoice", icon: Landmark },
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
    const sigRef = useRef<HTMLInputElement>(null)

    const [form, setForm] = useState({
        businessName: profile.businessName,
        ownerName: profile.ownerName,
        businessType: profile.businessType,
        gstin: profile.gstin || "",
        pan: profile.pan || "",
        state: profile.state || "Maharashtra",
        address: profile.address || "",
        city: profile.city || "",
        pincode: profile.pincode || "",
        mobile: profile.mobile || "",
        email: profile.email || "",
        invoicePrefix: profile.invoicePrefix,
        termsConditions: profile.termsConditions || "",
        bankName: profile.defaultBank?.bankName || "",
        accountName: profile.defaultBank?.accountName || "",
        accountNumber: profile.defaultBank?.accountNumber || "",
        ifscCode: profile.defaultBank?.ifscCode || "",
        branchName: profile.defaultBank?.branchName || "",
    })

    const [logoPreview, setLogoPreview] = useState<string | null>(profile.logoUrl)
    const [sigPreview, setSigPreview] = useState<string | null>(profile.signatureUrl)
    const [logoUrl, setLogoUrl] = useState<string | null>(profile.logoUrl)
    const [sigUrl, setSigUrl] = useState<string | null>(profile.signatureUrl)

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

    const processImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = (event) => {
                const img = new Image()
                img.src = event.target?.result as string
                img.onload = () => {
                    const canvas = document.createElement("canvas")
                    const MAX = 400 // Reasonable size for logos/signatures
                    let w = img.width
                    let h = img.height
                    if (w > h) {
                        if (w > MAX) { h *= MAX / w; w = MAX }
                    } else {
                        if (h > MAX) { w *= MAX / h; h = MAX }
                    }
                    canvas.width = w
                    canvas.height = h
                    const ctx = canvas.getContext("2d")!
                    ctx.drawImage(img, 0, 0, w, h)
                    resolve(canvas.toDataURL("image/jpeg", 0.8))
                }
                img.onerror = reject
            }
            reader.onerror = reject
        })
    }

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "signature") => {
        const file = e.target.files?.[0]
        if (!file) return
        
        if (type === "logo") setUploadingLogo(true)
        else setUploadingSig(true)

        try {
            const base64 = await processImage(file)
            if (type === "logo") {
                setLogoPreview(base64)
                setLogoUrl(base64)
            } else {
                setSigPreview(base64)
                setSigUrl(base64)
            }
            toast.success(`${type === "logo" ? "Logo" : "Signature"} processed!`)
        } catch (err) {
            console.error(err)
            toast.error("Failed to process image")
        } finally {
            if (type === "logo") setUploadingLogo(false)
            else setUploadingSig(false)
        }
    }

    const handleVerifyIFSC = async () => {
        const cleanIFSC = form.ifscCode?.trim().toUpperCase()
        if (!cleanIFSC || cleanIFSC.length < 11) {
            toast.error("Please enter a valid 11-digit IFSC code")
            return
        }

        setVerifyingIFSC(true)
        try {
            console.log("Verifying IFSC:", cleanIFSC)
            const res = await fetch(`https://ifsc.razorpay.com/${cleanIFSC}`)
            if (res.ok) {
                const data = await res.json()
                console.log("IFSC Data received:", data)
                
                setForm(prev => ({
                    ...prev,
                    bankName: data.BANK || "",
                    branchName: data.BRANCH || "",
                    accountName: prev.accountName || prev.businessName || ""
                }))
                
                toast.success("Bank details fetched!")
            } else {
                const errJson = await res.json().catch(() => ({}))
                toast.error(errJson.error || "Invalid IFSC code")
            }
        } catch (error) {
            console.error("IFSC Fetch Error:", error)
            toast.error("Network error: Could not reach IFSC service")
        } finally {
            setVerifyingIFSC(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const result = await updateBusinessProfile({
                id: profile.id,
                ...form,
                state: form.state,
                address: form.address,
                city: form.city,
                pincode: form.pincode,
                mobile: form.mobile,
                logoUrl: logoUrl || undefined,
                signatureUrl: sigUrl || undefined,
            })
            if (!result.success) throw new Error(result.error)
            toast.success("Settings saved successfully!")
            router.refresh()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Save failed")
        } finally {
            setSaving(false)
        }
    }

    const InputClass = "w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all text-sm"
    const LabelClass = "block text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide"

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Business Settings</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage your business profile, tax details, and invoice branding</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || uploadingLogo || uploadingSig}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all disabled:opacity-60 shadow-lg shadow-primary/20"
                >
                    {saving ? (
                        <><Loader2 size={15} className="animate-spin" /> Saving...</>
                    ) : (
                        <><Save size={15} /> Save Changes</>
                    )}
                </button>
            </div>

            {/* Profile Preview Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-2xl p-6 flex items-center gap-5"
            >
                <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                    {logoPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                        <span className="text-2xl">💎</span>
                    )}
                </div>
                <div>
                    <h2 className="text-foreground font-bold text-lg">{form.businessName}</h2>
                    <p className="text-muted-foreground text-sm">{form.businessType}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{form.mobile} {form.email ? `• ${form.email}` : ""}</p>
                </div>
                <div className="ml-auto text-right">
                    {!!form.gstin && <p className="text-xs text-muted-foreground">GSTIN: <span className="text-primary font-medium">{form.gstin}</span></p>}
                    {!!form.pan && <p className="text-xs text-muted-foreground mt-1">PAN: <span className="text-foreground">{form.pan}</span></p>}
                </div>
            </motion.div>

            {/* Tabs + Content */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {/* Tab Bar */}
                <div className="flex border-b border-border">
                    {TABS.map(tab => {
                        const Icon = tab.icon
                        const active = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all ${
                                    active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <Icon size={15} /> {tab.label}
                            </button>
                        )
                    })}
                </div>

                {/* Tab Content */}
                <div className="p-8">
                    {/* Business Tab */}
                    {activeTab === "business" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className={LabelClass}>Business Name *</label>
                                    <input value={form.businessName} onChange={e => set("businessName", e.target.value)} className={InputClass} />
                                </div>
                                <div>
                                    <label className={LabelClass}>Owner Name *</label>
                                    <input value={form.ownerName} onChange={e => set("ownerName", e.target.value)} className={InputClass} />
                                </div>
                            </div>
                            <div>
                                <label className={LabelClass}>Business Type</label>
                                <Select value={form.businessType} onValueChange={(val) => set("businessType", val)}>
                                    <SelectTrigger className={InputClass}>
                                        <SelectValue placeholder="Select business type" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border text-foreground max-h-[250px]" position="popper">
                                        {BUSINESS_TYPES.map(t => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Logo Upload */}
                            <div>
                                <label className={LabelClass}>Business Logo</label>
                                <div onClick={() => logoRef.current?.click()}
                                    className="border-2 border-dashed border-border hover:border-primary/40 rounded-xl p-5 cursor-pointer transition-colors flex items-center gap-4">
                                    {logoPreview ? (
                                        <>
                                            <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-background border border-border">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                                                {uploadingLogo && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 size={16} className="animate-spin text-white" /></div>}
                                            </div>
                                            <div>
                                                <p className="text-foreground text-sm font-medium">Logo {uploadingLogo ? "uploading..." : "uploaded"}</p>
                                                <p className="text-muted-foreground text-xs">Click to replace</p>
                                            </div>
                                            <button onClick={e => { e.stopPropagation(); setLogoPreview(null); setLogoUrl(null) }} className="ml-auto text-muted-foreground hover:text-[#EF4444]"><X size={16} /></button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center"><ImageIcon size={20} className="text-muted-foreground" /></div>
                                            <div>
                                                <p className="text-muted-foreground text-sm">Upload business logo</p>
                                                <p className="text-muted-foreground text-xs mt-0.5">PNG, JPG up to 2MB</p>
                                            </div>
                                            <Upload size={16} className="ml-auto text-muted-foreground" />
                                        </>
                                    )}
                                </div>
                                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageSelect(e, "logo")} />
                            </div>
                        </motion.div>
                    )}

                    {/* Tax Tab */}
                    {activeTab === "tax" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className={LabelClass}>GSTIN</label>
                                    <input value={form.gstin} onChange={e => set("gstin", e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" maxLength={15} className={InputClass} />
                                </div>
                                <div>
                                    <label className={LabelClass}>PAN Number *</label>
                                    <input value={form.pan} onChange={e => set("pan", e.target.value.toUpperCase())} placeholder="AAAAA0000A" maxLength={10} className={InputClass} />
                                </div>
                            </div>
                            <div>
                                <label className={LabelClass}>State *</label>
                                <Select value={form.state} onValueChange={(val) => set("state", val)}>
                                    <SelectTrigger className={InputClass}>
                                        <SelectValue placeholder="Select state" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border text-foreground max-h-[280px]" position="popper">
                                        {STATES.map(s => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="bg-background rounded-xl p-4 border border-border">
                                <p className="text-muted-foreground text-xs">💡 Your state determines CGST+SGST vs IGST on all invoices. Changing this will affect future invoices only.</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Contact Tab */}
                    {activeTab === "contact" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                            <div>
                                <label className={LabelClass}>Full Address *</label>
                                <textarea value={form.address} onChange={e => set("address", e.target.value)} rows={2} className={`${InputClass} resize-none`} />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className={LabelClass}>City *</label>
                                    <input value={form.city} onChange={e => set("city", e.target.value)} className={InputClass} />
                                </div>
                                <div>
                                    <label className={LabelClass}>State</label>
                                    <input value={form.state} readOnly className={`${InputClass} opacity-60`} />
                                </div>
                                <div>
                                    <label className={LabelClass}>Pincode *</label>
                                    <input value={form.pincode} onChange={e => set("pincode", e.target.value)} maxLength={6} className={InputClass} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={LabelClass}>Mobile *</label>
                                    <input value={form.mobile} onChange={e => set("mobile", e.target.value)} className={InputClass} />
                                </div>
                                <div>
                                    <label className={LabelClass}>Email</label>
                                    <input value={form.email} type="email" onChange={e => set("email", e.target.value)} className={InputClass} />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Bank Tab */}
                    {activeTab === "bank" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                            <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium border-b border-border pb-3">Default Bank Account (shown on invoices)</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={LabelClass}>Account Holder Name *</label>
                                    <input value={form.accountName} onChange={e => set("accountName", e.target.value)} className={InputClass} />
                                </div>
                                <div>
                                    <label className={LabelClass}>Bank Name *</label>
                                    <input value={form.bankName} onChange={e => set("bankName", e.target.value)} placeholder="HDFC Bank" className={InputClass} />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className={LabelClass}>Account Number *</label>
                                    <input value={form.accountNumber} onChange={e => set("accountNumber", e.target.value)} className={InputClass} />
                                </div>
                                <div>
                                    <label className={LabelClass}>IFSC Code *</label>
                                    <div className="flex gap-2">
                                        <input 
                                            value={form.ifscCode} 
                                            onChange={e => set("ifscCode", e.target.value.toUpperCase())} 
                                            placeholder="SBIN0000691"
                                            maxLength={11}
                                            className={InputClass} 
                                        />
                                        <button 
                                            type="button"
                                            onClick={handleVerifyIFSC}
                                            disabled={verifyingIFSC}
                                            className="px-4 bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-all font-semibold text-xs shrink-0"
                                        >
                                            {verifyingIFSC ? <Loader2 size={14} className="animate-spin" /> : "Verify"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={LabelClass}>Branch</label>
                                    <input value={form.branchName} onChange={e => set("branchName", e.target.value)} className={InputClass} />
                                </div>
                                <div>
                                    <label className={LabelClass}>Invoice Number Prefix</label>
                                    <input value={form.invoicePrefix} onChange={e => set("invoicePrefix", e.target.value.toUpperCase())} className={InputClass} />
                                </div>
                            </div>

                            {/* Signature Upload */}
                            <div className="border-t border-border pt-5">
                                <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium mb-4">Invoice Branding</p>
                                <label className={LabelClass}>Authorised Signature</label>
                                <div onClick={() => sigRef.current?.click()}
                                    className="border-2 border-dashed border-border hover:border-primary/40 rounded-xl p-5 cursor-pointer transition-colors flex items-center gap-4">
                                    {sigPreview ? (
                                        <>
                                            <div className="relative h-12 max-w-[120px] rounded bg-white border border-border overflow-hidden">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={sigPreview} alt="Signature" className="h-full w-full object-contain p-1" />
                                                {uploadingSig && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 size={14} className="animate-spin text-white" /></div>}
                                            </div>
                                            <div>
                                                <p className="text-foreground text-sm font-medium">Signature {uploadingSig ? "uploading..." : "uploaded"}</p>
                                                <p className="text-muted-foreground text-xs">Click to replace</p>
                                            </div>
                                            <div className="ml-auto flex gap-2">
                                                <button onClick={e => { e.stopPropagation(); sigRef.current?.click() }} className="text-muted-foreground hover:text-primary"><RefreshCw size={15} /></button>
                                                <button onClick={e => { e.stopPropagation(); setSigPreview(null); setSigUrl(null) }} className="text-muted-foreground hover:text-[#EF4444]"><X size={15} /></button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-10 rounded-xl bg-background flex items-center justify-center"><ImageIcon size={18} className="text-muted-foreground" /></div>
                                            <div>
                                                <p className="text-muted-foreground text-sm">Upload signature</p>
                                                <p className="text-muted-foreground text-xs mt-0.5">PNG with transparent background preferred</p>
                                            </div>
                                            <Upload size={16} className="ml-auto text-muted-foreground" />
                                        </>
                                    )}
                                </div>
                                <input ref={sigRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageSelect(e, "signature")} />
                            </div>

                            <div>
                                <label className={LabelClass}>Default Terms & Conditions</label>
                                <textarea 
                                    value={form.termsConditions || ""} 
                                    onChange={e => set("termsConditions", e.target.value)} 
                                    rows={4} 
                                    className={`${InputClass} resize-none`}
                                    placeholder="Enter your business terms and conditions here..."
                                />
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Danger Zone: Sign Out */}
            <div className="pt-6 pb-4 mb-8 border-t border-border/50">
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-red-500 font-semibold mb-1">Sign out of Dashboard</h3>
                        <p className="text-muted-foreground text-sm">You will be required to log in again to access the business data.</p>
                    </div>
                    <form action={signOutAction}>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 font-semibold transition-all"
                        >
                            <LogOut size={18} />
                            Sign Out
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
