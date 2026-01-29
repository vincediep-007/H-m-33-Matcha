import { NextRequest, NextResponse } from 'next/server'
import db from '../../lib/db'

export const dynamic = 'force-dynamic'


const ADMIN_PIN = process.env.ADMIN_PIN || '1234'

// GET all groups with their options
export async function GET() {
    try {
        const groups = await db.query('SELECT * FROM option_groups ORDER BY id ASC')
        const options = await db.query('SELECT * FROM options ORDER BY sort_order ASC, id ASC')

        console.log(`API diagnostic: Groups=${groups.length}, Options=${options.length}`)
        if (groups.length > 0) console.log('Sample Group:', JSON.stringify(groups[0]))

        // Nest options inside groups
        const data = groups.map((g: any) => ({
            ...g,
            id: Number(g.id),
            is_visible: Number(g.is_visible),
            options: options.filter((o: any) => String(o.group_id) === String(g.id)).map((o: any) => ({
                ...o,
                id: Number(o.id),
                group_id: Number(o.group_id),
                price_modifier: Number(o.price_modifier),
                is_available: Number(o.is_available),
                is_visible: Number(o.is_visible),
                sort_order: Number(o.sort_order)
            }))
        }))

        return NextResponse.json(data)

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}



export async function POST(request: NextRequest) {
    try {
        const pin = request.headers.get('X-Admin-Pin')
        if (pin !== ADMIN_PIN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { type } = body

        if (type === 'group') {
            const { name, description, isMultiSelect, isRequired, isVisible } = body
            const res = await db.run(
                'INSERT INTO option_groups (name, description, is_multi_select, is_required, is_visible) VALUES (?, ?, ?, ?, ?)',
                [name, description, isMultiSelect ? 1 : 0, isRequired ? 1 : 0, isVisible ? 1 : 0]
            )
            return NextResponse.json({ id: res.id })
        } else {
            // Option Item
            const { groupId, name, description, priceModifier, isAvailable, isVisible, imageUrl, priceModifiersJson, sort_order, image_focus, crop_data } = body
            const res = await db.run(
                'INSERT INTO options (group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [groupId, name, description || '', priceModifier || 0, isAvailable ? 1 : 0, isVisible ? 1 : 0, imageUrl || '', priceModifiersJson || null, sort_order || 0, image_focus || 'center', crop_data || null]
            )
            return NextResponse.json({ id: res.id })
        }
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const pin = request.headers.get('X-Admin-Pin')
        if (pin !== ADMIN_PIN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { type } = body
        const id = parseInt(body.id) || body.id


        if (type === 'group') {
            const { is_visible, name, description, isMultiSelect, isRequired } = body
            // Partial Toggle
            if (name === undefined) {
                await db.run('UPDATE option_groups SET is_visible = ? WHERE id = ?', [is_visible ? 1 : 0, id])
                return NextResponse.json({ success: true })
            }
            // Full Edit
            await db.run(
                'UPDATE option_groups SET name = ?, description = ?, is_multi_select = ?, is_required = ? WHERE id = ?',
                [name, description || '', isMultiSelect ? 1 : 0, isRequired ? 1 : 0, id]
            )
            return NextResponse.json({ success: true })
        } else {
            const { is_visible, is_available, name, description, priceModifier, image_url, priceModifiersJson, sort_order, image_focus, crop_data } = body

            // Partial Toggle
            if (name === undefined && is_visible !== undefined && is_available === undefined && sort_order === undefined) {
                await db.run('UPDATE options SET is_visible = ? WHERE id = ?', [is_visible ? 1 : 0, id])
                return NextResponse.json({ success: true })
            }
            if (name === undefined && is_available !== undefined && is_visible === undefined && sort_order === undefined) {
                await db.run('UPDATE options SET is_available = ? WHERE id = ?', [is_available ? 1 : 0, id])
                return NextResponse.json({ success: true })
            }
            // Sort Order Update
            if (sort_order !== undefined && name === undefined) {
                await db.run('UPDATE options SET sort_order = ? WHERE id = ?', [sort_order, id])
                return NextResponse.json({ success: true })
            }

            // Full Edit
            await db.run(
                'UPDATE options SET name = ?, description = ?, price_modifier = ?, image_url = ?, price_modifiers_json = ?, sort_order = ?, image_focus = ?, crop_data = ? WHERE id = ?',
                [name, description || '', priceModifier || 0, image_url || '', priceModifiersJson || null, sort_order || 0, image_focus || 'center', crop_data || null, id]
            )
            return NextResponse.json({ success: true })
        }
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const pin = request.headers.get('X-Admin-Pin')
        if (pin !== ADMIN_PIN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { type } = body
        const id = parseInt(body.id) || body.id

        if (type === 'group') {

            await db.run('DELETE FROM option_groups WHERE id = ?', [id])
        } else {
            await db.run('DELETE FROM options WHERE id = ?', [id])
        }
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
