import { NextRequest, NextResponse } from 'next/server'
import db from '../../lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0



const ADMIN_PIN = process.env.ADMIN_PIN || '1234'
export async function GET() {
    console.log('API: GET /api/products triggered')
    try {
        const products = await db.query('SELECT * FROM products')
        const sizes = await db.query('SELECT * FROM product_sizes')
        const links = await db.query('SELECT * FROM product_option_links')
        const recipes = await db.query('SELECT * FROM product_recipes')

        console.log(`API: Found ${products.length} products, ${sizes.length} sizes, ${links.length} links, ${recipes.length} recipes`)

        const data = products.map((p: any) => ({
            ...p,
            sizes: sizes.filter((s: any) => s.product_id == p.id),
            option_group_ids: links.filter((l: any) => l.product_id == p.id).map((l: any) => l.group_id),
            recipe: recipes.filter((r: any) => r.product_id == p.id).map((r: any): any => ({ ingredientId: r.ingredient_id, quantity: r.quantity, sizeName: r.size_name }))
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
        const { name, categoryId, description, imageUrl, sizes, optionGroupIds, recipe } = body

        const prodRes = await db.run(
            'INSERT INTO products (name, category_id, description, image_url, is_available, is_visible) VALUES (?, ?, ?, ?, 1, 1)',
            [name, categoryId, description || '', imageUrl || '']
        )
        const productId = prodRes.id

        // Insert Sizes
        if (sizes && Array.isArray(sizes)) {
            for (const s of sizes) {
                await db.run('INSERT INTO product_sizes (product_id, size_name, price) VALUES (?, ?, ?)', [productId, s.size_name, s.price])
            }
        }

        // Insert Links
        if (optionGroupIds && Array.isArray(optionGroupIds)) {
            for (const gid of optionGroupIds) {
                await db.run('INSERT INTO product_option_links (product_id, group_id) VALUES (?, ?)', [productId, gid])
            }
        }

        // Insert Recipe
        if (recipe && Array.isArray(recipe)) {
            for (const r of recipe) {
                await db.run('INSERT INTO product_recipes (product_id, ingredient_id, quantity, size_name) VALUES (?, ?, ?, ?)', [productId, r.ingredientId, r.quantity, r.sizeName || r.size_name || null])
            }
        }

        return NextResponse.json({ id: productId })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const pin = request.headers.get('X-Admin-Pin')
        if (pin !== ADMIN_PIN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { id, name, categoryId, description, imageUrl, sizes, optionGroupIds, is_available, is_visible, recipe } = body

        // Handle Toggle Updates (Partial)
        if (name === undefined) {
            if (is_available !== undefined) {
                await db.run('UPDATE products SET is_available = ? WHERE id = ?', [is_available ? 1 : 0, id])
                return NextResponse.json({ success: true })
            }
            if (is_visible !== undefined) {
                await db.run('UPDATE products SET is_visible = ? WHERE id = ?', [is_visible ? 1 : 0, id])
                return NextResponse.json({ success: true })
            }
        }

        // Full Update
        await db.run(
            'UPDATE products SET name = ?, category_id = ?, description = ?, image_url = ? WHERE id = ?',
            [name, categoryId, description || '', imageUrl || '', id]
        )

        // Re-write Sizes
        await db.run('DELETE FROM product_sizes WHERE product_id = ?', [id])
        if (sizes && Array.isArray(sizes)) {
            for (const s of sizes) {
                await db.run('INSERT INTO product_sizes (product_id, size_name, price) VALUES (?, ?, ?)', [id, s.name || s.size_name, s.price])
            }
        }

        // Re-write Links
        await db.run('DELETE FROM product_option_links WHERE product_id = ?', [id])
        if (optionGroupIds && Array.isArray(optionGroupIds)) {
            for (const gid of optionGroupIds) {
                await db.run('INSERT INTO product_option_links (product_id, group_id) VALUES (?, ?)', [id, gid])
            }
        }

        // Re-write Recipe
        await db.run('DELETE FROM product_recipes WHERE product_id = ?', [id])
        if (recipe && Array.isArray(recipe)) {
            for (const r of recipe) {
                await db.run('INSERT INTO product_recipes (product_id, ingredient_id, quantity, size_name) VALUES (?, ?, ?, ?)', [id, r.ingredientId, r.quantity, r.sizeName || r.size_name || null])
            }
        }

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

        await db.run('DELETE FROM products WHERE id = ?', [id])
        await db.run('DELETE FROM product_sizes WHERE product_id = ?', [id])
        await db.run('DELETE FROM product_option_links WHERE product_id = ?', [id])
        await db.run('DELETE FROM product_recipes WHERE product_id = ?', [id]) // Clean up recipes too

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
