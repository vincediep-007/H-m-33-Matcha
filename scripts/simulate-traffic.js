// Native fetch in Node 18+

const BASE_URL = 'http://localhost:3000';
const ADMIN_PIN = '1234';

async function main() {
    console.log("🚀 Starting Day Simulation...");

    // 1. Fetch Menu
    console.log("📥 Fetching Menu...");
    const [productsRes, categoriesRes] = await Promise.all([
        fetch(`${BASE_URL}/api/products`),
        fetch(`${BASE_URL}/api/categories`)
    ]);

    if (!productsRes.ok || !categoriesRes.ok) {
        console.error("❌ Failed to fetch menu. Is server running?");
        return;
    }

    const products = await productsRes.json();
    const categories = await categoriesRes.json();

    const availableProducts = products.filter(p => p.is_available && p.is_visible);

    if (availableProducts.length === 0) {
        console.error("❌ No available products to order.");
        return;
    }

    console.log(`✅ Loaded ${availableProducts.length} products.`);

    // 2. Simulate 100 Orders
    const TOTAL_ORDERS = 100;
    console.log(`⚡ Generating ${TOTAL_ORDERS} orders...`);

    for (let i = 1; i <= TOTAL_ORDERS; i++) {
        const orderData = generateRandomOrder(availableProducts);

        // A. PLACE ORDER
        try {
            const res = await fetch(`${BASE_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (!res.ok) throw new Error(`Status ${res.status}`);
            const json = await res.json();
            const orderId = json.id;
            console.log(`[${i}/${TOTAL_ORDERS}] 🛒 Order #${orderId} (Display #${json.display_id}) Placed: ${orderData.total.toLocaleString()} VND`);

            // B. KITCHEN: PREPARING
            await updateStatus(orderId, 'preparing');

            // C. KITCHEN: COMPLETED
            await updateStatus(orderId, 'completed');

        } catch (err) {
            console.error(`❌ Failed Order ${i}:`, err.message);
        }

        // Small delay to prevent overwhelming SQLite file locking
        await new Promise(r => setTimeout(r, 50));
    }

    console.log("\n🎉 Simulation Complete! Check the Analysis Tab.");
}

function generateRandomOrder(products) {
    // 1-4 items per order
    const itemCount = Math.floor(Math.random() * 4) + 1;
    let items = [];
    let total = 0;

    for (let j = 0; j < itemCount; j++) {
        const product = products[Math.floor(Math.random() * products.length)];

        // Random Size
        let size = { size_name: 'M', price: 0 };
        if (product.sizes && product.sizes.length > 0) {
            size = product.sizes[Math.floor(Math.random() * product.sizes.length)];
        }

        // Random Options? (Harder to simulate without fetching Option Groups, assume simplified for now)
        // We will skip complex options for this basic simulation unless we fetch them too. 
        // Let's keep it simple: Just Product + Size + Quantity.

        const quantity = Math.floor(Math.random() * 2) + 1;
        const itemTotal = size.price * quantity;

        items.push({
            product: product,
            selectedSize: size,
            selectedOptions: [], // TODO: enhanced simulation could pick random options
            quantity: quantity,
            totalPrice: itemTotal
        });
        total += itemTotal;
    }

    return {
        items,
        total,
        details: Math.random() > 0.8 ? "Less ice please" : "", // 20% chance of note
        worker_id: 0
    };
}

async function updateStatus(id, status) {
    await fetch(`${BASE_URL}/api/orders`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Admin-Pin': ADMIN_PIN
        },
        body: JSON.stringify({ id, status, workerId: 1 })
    });
}

main();
