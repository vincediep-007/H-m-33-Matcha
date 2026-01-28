import { NextRequest, NextResponse } from 'next/server'
import db from '../../lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const since = searchParams.get('since') // 'today'

  try {
    if (id) {
      const orders = await db.query('SELECT * FROM orders WHERE id = ?', [id])
      if (orders.length === 0) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

      const order = orders[0]
      try { order.items = JSON.parse(order.items) } catch (e) { order.items = [] }
      return NextResponse.json(order)
    } else {
      let query = 'SELECT * FROM orders '
      const params = []

      if (since === 'today') {
        // Vietnam is UTC+7. We want orders from 00:00 VN time today.
        // In UTC, this is 17:00 previous day (if today is 28th, 00:00 VN = 17:00 27th UTC)
        // SQL: created_at >= datetime('now', '+7 hours', 'start of day', '-7 hours')
        query += "WHERE created_at >= datetime('now', '+7 hours', 'start of day', '-7 hours') "
      }

      query += 'ORDER BY created_at DESC LIMIT 100' // Limit 50 -> 100
      const orders = await db.query(query, params)
      const data = orders.map((o: any) => {
        try { o.items = JSON.parse(o.items) } catch (e) { o.items = [] }
        return o
      })
      return NextResponse.json(data)
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, total, details, worker_id, created_at, status } = body

    if (!items || !total) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

    // Calculate Cyclic Display ID (1-99)
    // Get the most recent display_id
    const lastOrder = await db.query('SELECT display_id FROM orders ORDER BY id DESC LIMIT 1')
    let nextId = 1
    if (lastOrder.length > 0 && lastOrder[0].display_id) {
      nextId = (lastOrder[0].display_id % 99) + 1
    }

    const result = await db.run(
      'INSERT INTO orders (items, total, details, worker_id, status, display_id, created_at) VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))',
      [JSON.stringify(items), total, details || '', worker_id || 0, status || 'pending_payment', nextId, created_at || null]
    )

    return NextResponse.json({ id: result.id, display_id: nextId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, worker_id } = body

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    // Update Status and/or Worker
    // If worker_id is provided, update it. If status is provided, update it.
    // We'll update both if both present.

    let sql = 'UPDATE orders SET '
    const params = []
    const updates = []

    if (status) {
      updates.push('status = ?')
      params.push(status)
    }
    if (worker_id) {
      updates.push('worker_id = ?')
      params.push(worker_id)
    }

    if (updates.length === 0) return NextResponse.json({ success: true }) // Nothing to do

    sql += updates.join(', ') + ' WHERE id = ?'
    params.push(id)

    await db.run(sql, params)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}