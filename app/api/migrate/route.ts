import { NextRequest, NextResponse } from 'next/server'
import db from '../../lib/db'

export async function GET(request: NextRequest) {
    try {
        const pin = request.headers.get('X-Admin-Pin')
        // if (pin !== '1234') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // 1. Rename Toppings
        await db.run("UPDATE option_groups SET name = 'Toppings' WHERE name = 'Topping0'");

        // 2. Add sort_order to Options
        try {
            await db.run("ALTER TABLE options ADD COLUMN sort_order INTEGER DEFAULT 0");
        } catch (e: any) {
            if (!e.message.includes('duplicate')) console.log('Col exists or other error: ' + e.message);
        }

        // 3. Add image_url to Options (just in case)
        try {
            await db.run("ALTER TABLE options ADD COLUMN image_url TEXT");
        } catch (e: any) {
            // likely exists
        }

        return NextResponse.json({ success: true, message: 'Schema updated' })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
