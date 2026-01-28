import { NextRequest, NextResponse } from 'next/server'
import db from '../../lib/db'

export async function POST(request: NextRequest) {
  const { orderId, workerId } = await request.json()
  try {
    await db.run('UPDATE orders SET worker_id = ? WHERE id = ?', [workerId, orderId])
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}