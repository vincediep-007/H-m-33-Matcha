import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import fs from 'fs'

export async function POST(request: NextRequest) {
    try {
        const data = await request.formData()
        const file: File | null = data.get('file') as unknown as File

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Ensure uploads directory exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads')
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
        }

        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const ext = path.extname(file.name)
        const filename = file.name.replace(ext, '') + '-' + uniqueSuffix + ext
        const filepath = path.join(uploadDir, filename)

        await writeFile(filepath, buffer)
        console.log(`Saved file to ${filepath}`)

        return NextResponse.json({ url: `/uploads/${filename}` })
    } catch (err: any) {
        console.error("Upload error:", err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
