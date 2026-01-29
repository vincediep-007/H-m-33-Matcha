import { NextRequest, NextResponse } from 'next/server'
import db from '../../lib/db'

export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const timeframe = searchParams.get('timeframe') || 'week'
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  try {
    // 1. Build Date Filter
    let dateFilter = "created_at >= ?"
    let params: any[] = []

    const now = new Date()
    let days = 7
    if (timeframe === 'month') days = 30
    if (timeframe === 'quarter') days = 90
    if (timeframe === 'year') days = 365

    const filterDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))
    params.push(filterDate.toISOString().replace('T', ' ').replace('Z', ''))

    // Custom Date Range Override
    if (dateFrom && dateTo) {
      dateFilter = `created_at >= ? AND created_at <= ?`
      params = [`${dateFrom} 00:00:00`, `${dateTo} 23:59:59`]
    }

    // 2. Fetch Metadata for Grouping (Categories, Option Groups) AND Costing (Ingredients, Recipes)
    const [categories, products, groups, options, ingredients, recipes] = await Promise.all([
      db.query("SELECT id, name FROM categories"),
      db.query("SELECT id, name, category_id FROM products"),
      db.query("SELECT id, name FROM option_groups"),
      db.query("SELECT id, name, group_id FROM options"),
      db.query("SELECT id, cost_per_gram FROM ingredients"),
      db.query("SELECT product_id, ingredient_id, quantity FROM product_recipes")
    ])

    // Create Lookups
    const productCatMap: Record<string, string> = {} // ProductName -> CategoryName
    const productCostMap: Record<number, number> = {} // ProductID -> BaseCost

    // Calculate Base Cost per Product
    products.forEach((p: any) => {
      const prodRecipes = recipes.filter((r: any) => r.product_id === p.id)
      let cost = 0
      prodRecipes.forEach((r: any) => {
        const ing = ingredients.find((i: any) => i.id === r.ingredient_id)
        if (ing) cost += (ing.cost_per_gram * r.quantity)
      })
      productCostMap[p.id] = cost

      const cat = categories.find((c: any) => c.id === p.category_id)
      productCatMap[p.name] = cat ? cat.name : 'Uncategorized'
    })

    const optionGroupMap: Record<string, string> = {} // OptionName -> GroupName
    options.forEach((o: any) => {
      const grp = groups.find((g: any) => g.id === o.group_id)
      optionGroupMap[o.name] = grp ? grp.name : 'Other'
    })

    // 3. Fetch Orders
    const orders = await db.query(`SELECT items, total FROM orders WHERE status = 'completed' AND ${dateFilter}`, params)

    // 4. Aggregate Data
    let totalRevenue = 0
    let totalCost = 0

    // Global Product Stats
    const productStats: Record<string, { qty: number, revenue: number, category: string }> = {}

    // Category Stats: Key = CategoryName
    const categoryStats: Record<string, { totalQty: number, totalRev: number, products: Record<string, number> }> = {}

    // Option Group Stats: Key = GroupName
    const groupStats: Record<string, { totalQty: number, options: Record<string, number> }> = {}

    orders.forEach((o: any) => {
      totalRevenue += o.total
      let items = []
      try { items = JSON.parse(o.items) } catch (e) { }

      items.forEach((item: any) => {
        // --- Product Aggregation ---
        // Support both old nesting (item.product.name) and flat (item.name)
        const pName = item.name || item.product?.name || 'Unknown Product'
        const pId = item.id || item.product?.id
        const catName = productCatMap[pName] || 'Uncategorized'

        // Cost Calculation
        const baseCost = productCostMap[pId] || 0
        totalCost += (baseCost * (item.quantity || 1))

        // Global
        if (!productStats[pName]) productStats[pName] = { qty: 0, revenue: 0, category: catName }
        productStats[pName].qty += item.quantity || 0
        productStats[pName].revenue += (item.price * item.quantity) || 0 // Use item.price if total not there

        // Category Detail
        if (!categoryStats[catName]) categoryStats[catName] = { totalQty: 0, totalRev: 0, products: {} }
        categoryStats[catName].totalQty += item.quantity || 0
        categoryStats[catName].totalRev += (item.price * item.quantity) || 0
        categoryStats[catName].products[pName] = (categoryStats[catName].products[pName] || 0) + (item.quantity || 0)

        // --- Option Aggregation ---
        // Support 'options' (Simulator) or 'selectedOptions'
        const opts = item.options || item.selectedOptions
        if (opts && Array.isArray(opts)) {
          opts.forEach((opt: any) => {
            const optName = opt.name || 'Unknown'
            const grpName = optionGroupMap[optName] || 'Other'

            if (!groupStats[grpName]) groupStats[grpName] = { totalQty: 0, options: {} }
            groupStats[grpName].totalQty += (item.quantity || 0) // Options count = item qty (usually)
            groupStats[grpName].options[optName] = (groupStats[grpName].options[optName] || 0) + (item.quantity || 0)
          })
        }
      })
    })

    // 5. Format Results
    const totalIncome = totalRevenue - totalCost

    // Top 3 Products for Chart
    const topProducts = Object.entries(productStats)
      .map(([name, stat]) => ({ name, qty: stat.qty, revenue: stat.revenue, category: stat.category }))
      .sort((a, b) => b.qty - a.qty)

    // Category Best Sellers
    const categoryAnalysis = Object.entries(categoryStats).map(([catName, data]) => {
      const bestProduct = Object.entries(data.products).sort((a, b) => b[1] - a[1])[0]
      return {
        category: catName,
        totalSold: data.totalQty,
        revenue: data.totalRev,
        bestSeller: bestProduct ? { name: bestProduct[0], qty: bestProduct[1] } : null
      }
    }).sort((a, b) => b.revenue - a.revenue)

    // Option Group Best Sellers
    const groupAnalysis = Object.entries(groupStats).map(([grpName, data]) => {
      const bestOption = Object.entries(data.options).sort((a, b) => b[1] - a[1])[0]
      return {
        group: grpName,
        totalUsage: data.totalQty,
        bestOption: bestOption ? { name: bestOption[0], qty: bestOption[1] } : null
      }
    }).filter(g => g.group !== 'Other').sort((a, b) => b.totalUsage - a.totalUsage)

    return NextResponse.json({
      totalRevenue,
      totalCost,
      totalIncome,
      topProducts, // All products sorted
      categoryAnalysis,
      groupAnalysis
    })

  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}