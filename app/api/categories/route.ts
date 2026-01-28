import { NextRequest, NextResponse } from 'next/server'
import db from '../../lib/db'

const ADMIN_PIN = process.env.ADMIN_PIN || '1234'

export async function GET() {
    try {
        const categories = await db.query('SELECT * FROM categories ORDER BY sort_order')
        return NextResponse.json(categories)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const pin = request.headers.get('X-Admin-Pin')
        if (pin !== ADMIN_PIN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Added imageUrl destructuring
        const { name, description, imageUrl } = await request.json()

        const result = await db.run(
            'INSERT INTO categories (name, description, image_url) VALUES (?, ?, ?)',
            [name, description || '', imageUrl || '']
        )
        return NextResponse.json({ id: result.id })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const pin = request.headers.get('X-Admin-Pin')
        if (pin !== ADMIN_PIN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id, name, description, is_visible, sort_order, imageUrl } = await request.json()

        // Handle Toggle Updates (Partial)
        if (name === undefined && description === undefined && sort_order === undefined && is_visible !== undefined) {
            await db.run('UPDATE categories SET is_visible = ? WHERE id = ?', [is_visible ? 1 : 0, id])
            return NextResponse.json({ success: true })
        }

        // Handle Full Edit
        await db.run(
            'UPDATE categories SET name = ?, description = ?, sort_order = ?, image_url = ? WHERE id = ?',
            [name, description || '', sort_order || 0, imageUrl || '', id]
        )
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const pin = request.headers.get('X-Admin-Pin')
        if (pin !== ADMIN_PIN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = await request.json()
        await db.run('DELETE FROM categories WHERE id = ?', [id])
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
