import { NextResponse } from 'next/server'
import db from '../../lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
    try {
        const productsCount = await db.query('SELECT count(*) as c FROM products')
        const sizesCount = await db.query('SELECT count(*) as c FROM product_sizes')
        const optionsCount = await db.query('SELECT count(*) as c FROM options')
        const linksCount = await db.query('SELECT count(*) as c FROM product_option_links')

        const sampleProduct = await db.query('SELECT id, name FROM products LIMIT 1')
        const sampleSize = await db.query('SELECT id, product_id, size_name FROM product_sizes LIMIT 5')
        const sampleLink = await db.query('SELECT product_id, group_id FROM product_option_links LIMIT 5')

        return NextResponse.json({
            counts: {
                products: productsCount[0]?.c,
                sizes: sizesCount[0]?.c,
                options: optionsCount[0]?.c,
                links: linksCount[0]?.c
            },
            samples: {
                product: sampleProduct[0],
                sizes: sampleSize,
                links: sampleLink
            },
            env: {
                isVercel: process.env.VERCEL === '1',
                hasPgUrl: !!process.env.POSTGRES_URL
            }
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 })
    }
}
