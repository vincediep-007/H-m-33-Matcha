import { NextRequest, NextResponse } from 'next/server'
import db from '../../lib/db'

export const dynamic = 'force-dynamic'


const ADMIN_PIN = process.env.ADMIN_PIN || '1234'

export async function POST(request: NextRequest) {
    try {
        const pin = request.headers.get('X-Admin-Pin')
        if (pin !== ADMIN_PIN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { action } = await request.json()

        if (action === 'reset_menu') {
            await db.run(`DELETE FROM product_option_links`);
            await db.run(`DELETE FROM options`);
            await db.run(`DELETE FROM option_groups`);
            await db.run(`DELETE FROM product_sizes`);
            await db.run(`DELETE FROM products`);
            await db.run(`DELETE FROM categories`);
            // Note: We don't delete Orders or Surveys unless requested, to keep business data safe.
            return NextResponse.json({ success: true, message: 'Menu data cleared.' })
        } else if (action === 'reset_sales') {
            await db.run(`DELETE FROM orders`);
            // Reset sequence if needed? SQLite autoincrement doesn't reset easily without DROP TABLE or explicit udpate.
            // But display_id is calculated manually in POST order, so it safely resets to 1 if table is empty.
            return NextResponse.json({ success: true, message: 'Sales history cleared.' })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
