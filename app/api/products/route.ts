import { NextRequest, NextResponse } from 'next/server'
import db from '../../lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0



const ADMIN_PIN = process.env.ADMIN_PIN || '1234'
export async function GET() {
    console.log('API: GET /api/products triggered')
    try {
        const products = await db.query('SELECT * FROM products ORDER BY id ASC')
        const sizes = await db.query('SELECT * FROM product_sizes ORDER BY id ASC')
        const links = await db.query('SELECT * FROM product_option_links ORDER BY product_id ASC, group_id ASC')
        const recipes = await db.query('SELECT * FROM product_recipes ORDER BY id ASC')

        console.log(`API diagnostic: Products=${products.length}, Sizes=${sizes.length}, Links=${links.length}, Recipes=${recipes.length}`)
        if (products.length > 0) {
            const p = products[0];
            console.log('SAMPLE PRODUCT KEYS:', Object.keys(p).join(', '))
            console.log('SAMPLE PRODUCT ID TYPE:', typeof p.id, 'VALUE:', p.id)
        }
        if (sizes.length > 0) {
            const s = sizes[0];
            console.log('SAMPLE SIZE KEYS:', Object.keys(s).join(', '))
            console.log('SAMPLE SIZE PRODUCT_ID TYPE:', typeof s.product_id, 'VALUE:', s.product_id)
        }

        const data = products.map((p: any) => ({
            ...p,
            id: Number(p.id),
            category_id: Number(p.category_id),
            is_available: Number(p.is_available),
            is_visible: Number(p.is_visible),
            sizes: sizes.filter((s: any) => {
                const match = String(s.product_id).trim() === String(p.id).trim();
                // console.log(`DEBUG SIZE MATCH: ProdID=${p.id} SizeProdID=${s.product_id} Match=${match}`) 
                return match;
            }).map((s: any) => ({

                id: Number(s.id),
                product_id: Number(s.product_id),
                size_name: s.size_name,
                price: Number(s.price)
            })),
            option_group_ids: links.filter((l: any) => String(l.product_id) === String(p.id)).map((l: any) => Number(l.group_id)),
            recipe: recipes.filter((r: any) => String(r.product_id) === String(p.id)).map((r: any): any => ({
                ingredientId: Number(r.ingredient_id),
                quantity: Number(r.quantity),
                sizeName: r.size_name
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
        const { name, categoryId, description, imageUrl, sizes, optionGroupIds, recipe } = body

        const prodRes = await db.run(
            'INSERT INTO products (name, category_id, description, image_url, is_available, is_visible) VALUES (?, ?, ?, ?, 1, 1)',
            [name, parseInt(categoryId) || categoryId, description || '', imageUrl || '']
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
        const { name, categoryId, description, imageUrl, sizes, optionGroupIds, is_available, is_visible, recipe } = body
        const id = parseInt(body.id) || body.id

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

        console.log(`API: Updating product ${id}`, { sizesCount: sizes?.length })

        // Full Update
        await db.run(
            'UPDATE products SET name = ?, category_id = ?, description = ?, image_url = ? WHERE id = ?',
            [name, parseInt(categoryId) || categoryId, description || '', imageUrl || '', id]
        )

        // Re-write Sizes
        await db.run('DELETE FROM product_sizes WHERE product_id = ?', [id])
        if (sizes && Array.isArray(sizes)) {
            for (const s of sizes) {
                await db.run('INSERT INTO product_sizes (product_id, size_name, price) VALUES (?, ?, ?)', [id, s.name || s.size_name, s.price])
            }
        }

        // Re-write Links
        console.log(`API: Syncing ${optionGroupIds?.length || 0} links for product ${id}`)
        await db.run('DELETE FROM product_option_links WHERE product_id = ?', [id])
        if (optionGroupIds && Array.isArray(optionGroupIds)) {
            for (const gid of optionGroupIds) {
                const parsedGid = parseInt(gid) || gid;
                console.log(`API: Linking product ${id} to group ${parsedGid}`)
                await db.run('INSERT INTO product_option_links (product_id, group_id) VALUES (?, ?)', [id, parsedGid])
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
        const id = parseInt(body.id) || body.id

        await db.run('DELETE FROM products WHERE id = ?', [id])
        await db.run('DELETE FROM product_sizes WHERE product_id = ?', [id])
        await db.run('DELETE FROM product_option_links WHERE product_id = ?', [id])
        await db.run('DELETE FROM product_recipes WHERE product_id = ?', [id]) // Clean up recipes too


        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
