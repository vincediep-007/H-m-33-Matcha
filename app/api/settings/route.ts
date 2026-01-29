import { NextRequest, NextResponse } from 'next/server'
import db from '../../lib/db'

export const dynamic = 'force-dynamic'


const ADMIN_PIN = process.env.ADMIN_PIN || '1234'

export async function GET() {
    try {
        const settings = await db.query('SELECT * FROM settings')
        const config: Record<string, any> = {}
        settings.forEach((s: any) => {
            config[s.key] = s.value
        })
        return NextResponse.json(config)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const pin = request.headers.get('X-Admin-Pin')
        if (pin !== ADMIN_PIN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { action, key, value } = body

        if (action === 'update_setting') {
            await db.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [key, String(value)])
            return NextResponse.json({ success: true })
        }

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

