import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { auth } from "@/auth"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const formData = await req.formData()
        const file = formData.get("file") as File
        const type = formData.get("type") as string // "logo" | "signature"

        if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

        const ext = file.name.split(".").pop() || "png"
        const fileName = `${type}-${Date.now()}.${ext}`
        const buffer = await file.arrayBuffer()

        const { data, error } = await supabase.storage
            .from("business-assets")
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: true,
            })

        if (error) {
            console.error("Supabase Storage Error:", error)
            
            // If bucket doesn't exist, try creating it
            if (error.message.includes("Bucket not found") || (error as any).status === 404) {
                try {
                    const { error: createError } = await supabase.storage.createBucket("business-assets", { 
                        public: true,
                        fileSizeLimit: 2097152, // 2MB
                        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg']
                    })
                    
                    if (createError && !createError.message.includes("already exists")) {
                        return NextResponse.json({ 
                            error: `Storage bucket 'business-assets' not found. Please create it in your Supabase dashboard or check permissions. (${createError.message})` 
                        }, { status: 500 })
                    }

                    // Retry upload after creation attempt
                    const { data: retryData, error: retryError } = await supabase.storage
                        .from("business-assets")
                        .upload(fileName, buffer, { contentType: file.type, upsert: true })
                    
                    if (retryError) throw retryError
                    
                    const { data: urlData } = supabase.storage.from("business-assets").getPublicUrl(retryData.path)
                    return NextResponse.json({ url: urlData.publicUrl })
                } catch (bucketErr: any) {
                    return NextResponse.json({ 
                        error: `Failed to initialize storage: ${bucketErr.message}. Please create a public bucket named 'business-assets' in Supabase.` 
                    }, { status: 500 })
                }
            }
            throw error
        }

        const { data: urlData } = supabase.storage.from("business-assets").getPublicUrl(data.path)
        return NextResponse.json({ url: urlData.publicUrl })
    } catch (err: unknown) {
        console.error("Upload error:", err)
        const msg = err instanceof Error ? err.message : "Upload failed"
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
