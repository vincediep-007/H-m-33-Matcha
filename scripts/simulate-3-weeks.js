// Native fetch in Node 18+

const BASE_URL = 'http://localhost:3000';
const ADMIN_PIN = '1234';

const START_DATE = new Date('2025-12-25T08:00:00'); // Thursday
const END_DATE = new Date('2026-01-17T20:00:00');   // Saturday

// Random helpers
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomBoolean = () => Math.random() > 0.5;

async function main() {
    console.log("🚀 Starting Realistic 3-Week Simulation...");

    // 1. Clear Old Data
    console.log("🧹 Clearing old orders...");
    await fetch(`${BASE_URL}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': ADMIN_PIN },
        body: JSON.stringify({ action: 'reset_sales' })
    });

    // 2. Fetch Metadata
    console.log("📥 Fetching full menu...");
    const [prodRes, optRes] = await Promise.all([
        fetch(`${BASE_URL}/api/products`, { headers: { 'X-Admin-Pin': ADMIN_PIN } }),
        fetch(`${BASE_URL}/api/options`, { headers: { 'X-Admin-Pin': ADMIN_PIN } })
    ]);

    const products = await prodRes.json();
    const allGroups = await optRes.json(); // Groups with nested .options

    if (!products || products.length === 0) {
        console.error("❌ No products found! Cannot simulate.");
        return;
    }

    // Helper to get Groups for a Product
    const getProductGroups = (prod) => {
        if (!prod.option_group_ids || prod.option_group_ids.length === 0) return [];
        return allGroups.filter(g => prod.option_group_ids.includes(g.id));
    };

    // 3. Loop Dates
    let currentDate = new Date(START_DATE);
    let totalOrders = 0;
    let totalRevenue = 0;

    console.log("📅 Simulating from " + currentDate.toISOString().split('T')[0] + " to " + END_DATE.toISOString().split('T')[0]);

    while (currentDate <= END_DATE) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayOfWeek = currentDate.getDay(); // 0=Sun, 6=Sat
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

        // Determine number of orders (Weekdays: 50-100, Weekends: 150-200)
        const count = isWeekend ? randomInt(150, 200) : randomInt(50, 100);
        console.log(`   📝 ${dateStr} (${isWeekend ? 'Weekend' : 'Weekday'}): Generating ${count} orders...`);

        const promises = [];
        for (let i = 0; i < count; i++) {
            // Pick Random Time (8am - 8pm)
            const hour = randomInt(8, 20);
            const minute = randomInt(0, 59);
            const orderDate = new Date(currentDate);
            orderDate.setHours(hour, minute, 0, 0);
            const timestamp = orderDate.toISOString().replace('T', ' ').split('.')[0];

            // Pick Product & Size
            const product = randomItem(products);
            const size = (product.sizes && product.sizes.length > 0) ? randomItem(product.sizes) : { name: 'M', price: 50000 };

            let itemTotal = Number(size.price);
            const selectedOptions = [];

            // Process Options
            const relevantGroups = getProductGroups(product);

            for (const group of relevantGroups) {
                // Should we pick from this group?
                // If Required: YES.
                // If Optional: 50% chance.
                const shouldPick = group.is_required === 1 || randomBoolean();

                if (shouldPick) {
                    const availableOptions = group.options.filter(o => o.is_available === 1);
                    if (availableOptions.length === 0) continue;

                    if (group.is_multi_select === 1) {
                        // Multi: Pick 1 to 3 items
                        const numToPick = randomInt(1, Math.min(3, availableOptions.length));
                        // Shuffle and slice
                        const shuffled = [...availableOptions].sort(() => 0.5 - Math.random());
                        const picked = shuffled.slice(0, numToPick);

                        picked.forEach(opt => {
                            selectedOptions.push({ id: opt.id, name: opt.name, price: Number(opt.price_modifier) });
                            itemTotal += Number(opt.price_modifier);
                        });
                    } else {
                        // Single: Pick 1
                        const opt = randomItem(availableOptions);
                        selectedOptions.push({ id: opt.id, name: opt.name, price: Number(opt.price_modifier) });
                        itemTotal += Number(opt.price_modifier);
                    }
                }
            }

            // Construct Order
            const orderData = {
                items: [{
                    id: product.id,
                    name: product.name,
                    price: size.price,
                    quantity: 1,
                    size: size.name || size.size_name,
                    options: selectedOptions
                }],
                total: itemTotal,
                details: `${product.name} (${size.name || size.size_name})` + (selectedOptions.length ? ` + ${selectedOptions.length} opts` : ''),
                worker_id: 1,
                status: 'completed',
                created_at: timestamp
            };

            const p = fetch(`${BASE_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            }).then(r => {
                if (r.ok) totalRevenue += itemTotal;
            });
            promises.push(p);

            if (promises.length >= 20) {
                await Promise.all(promises);
                promises.length = 0;
            }
        }
        await Promise.all(promises);
        totalOrders += count;
        currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log("✅ Simulation Complete!");
    console.log(`   📦 Total Orders: ${totalOrders}`);
    console.log(`   💰 Total Revenue: ${totalRevenue.toLocaleString()}`);
}

main().catch(console.error);
