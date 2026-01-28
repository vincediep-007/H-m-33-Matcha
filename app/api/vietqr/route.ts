import { NextRequest, NextResponse } from 'next/server'

import QRCode from 'qrcode'

export async function GET(request: NextRequest) {
  try {
    const amount = request.nextUrl.searchParams.get('amount') || '100000'
    // For demo, generate QR with payment info
    const paymentText = `Pay ${amount} VND for Matcha Order via VietQR`
    const qrImage = await QRCode.toDataURL(paymentText)
    return NextResponse.json({ qr: qrImage })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to generate QR' }, { status: 500 })
  }
}