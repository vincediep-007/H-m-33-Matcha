import { NextRequest, NextResponse } from 'next/server'
import db from '../../lib/db'

export const dynamic = 'force-dynamic'


const ADMIN_PIN = process.env.ADMIN_PIN || '1234'

export async function GET() {
    try {
        const ingredients = await db.query('SELECT * FROM ingredients ORDER BY name')
        return NextResponse.json(ingredients)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const pin = request.headers.get('X-Admin-Pin')
        if (pin !== ADMIN_PIN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { name, costPerGram } = body

        if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

        const res = await db.run(
            'INSERT INTO ingredients (name, cost_per_gram) VALUES (?, ?)',
            [name, costPerGram || 0]
        )
        return NextResponse.json({ id: res.id })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const pin = request.headers.get('X-Admin-Pin')
        if (pin !== ADMIN_PIN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { id, name, costPerGram } = body

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        await db.run(
            'UPDATE ingredients SET name = ?, cost_per_gram = ? WHERE id = ?',
            [name, costPerGram || 0, id]
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

        const body = await request.json()
        const { id } = body

        // Check usage before delete? For now, allow simple delete.
        await db.run('DELETE FROM ingredients WHERE id = ?', [id])
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
