import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url') || 'http://localhost:3000/menu'
  const qr = await QRCode.toDataURL(url)
  return NextResponse.json({ qr })
}