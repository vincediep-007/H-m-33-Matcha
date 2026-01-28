import { NextRequest, NextResponse } from 'next/server'
import db from '../../lib/db'

export async function POST(request: NextRequest) {
  const { orderId, workerId, quality, time, manner, overall, comment } = await request.json()
  try {
    const result = await db.run(
      'INSERT INTO surveys (order_id, worker_id, quality, time, manner, overall, comment) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [orderId, workerId, quality, time, manner, overall, comment || '']
    )
    return NextResponse.json({ id: result.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}