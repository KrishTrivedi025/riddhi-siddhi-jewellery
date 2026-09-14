import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { auth } from "@/auth"

const BUCKET = "supplier-attachments"
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"]

// Lazy-init supabase — prevents build-time crash when env vars are missing
function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
        throw new Error("Supabase env vars not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)")
    }
    return createClient(url, key)
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const supabase = getSupabase()
        const formData = await req.formData()
        const file = formData.get("file") as File

        if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ error: "Only images and PDFs are allowed" }, { status: 400 })
        }
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: "File must be 5MB or smaller" }, { status: 400 })
        }

        const ext = file.name.split(".").pop() || (file.type === "application/pdf" ? "pdf" : "jpg")
        const fileName = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
        const buffer = await file.arrayBuffer()

        const upload = async () =>
            supabase.storage.from(BUCKET).upload(fileName, buffer, {
                contentType: file.type,
                upsert: true,
            })

        const { data: uploadData, error } = await upload()
        let data = uploadData

        if (error) {
            // If bucket doesn't exist, try creating it then retry once
            if (error.message.includes("Bucket not found") || (error as { status?: number }).status === 404) {
                const { error: createError } = await supabase.storage.createBucket(BUCKET, {
                    public: true,
                    fileSizeLimit: MAX_SIZE,
                    allowedMimeTypes: ALLOWED_TYPES,
                })
                if (createError && !createError.message.includes("already exists")) {
                    return NextResponse.json({
                        error: `Storage bucket '${BUCKET}' not found. Please create it in your Supabase dashboard. (${createError.message})`,
                    }, { status: 500 })
                }

                const retry = await upload()
                if (retry.error) throw retry.error
                data = retry.data
            } else {
                throw error
            }
        }

        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data!.path)
        const fileType = file.type === "application/pdf" ? "pdf" : "image"
        return NextResponse.json({ url: urlData.publicUrl, fileName: file.name, fileType })
    } catch (err: unknown) {
        console.error("Upload error:", err)
        const msg = err instanceof Error ? err.message : "Upload failed"
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
