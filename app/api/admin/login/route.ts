import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PIN = process.env.ADMIN_PIN || '1234'

export async function POST(request: NextRequest) {
    try {
        const { pin } = await request.json()
        if (pin === ADMIN_PIN) {
            return NextResponse.json({ success: true })
        } else {
            return NextResponse.json({ success: false }, { status: 401 })
        }
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
