
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('matcha.db');

const BASE_URL = 'http://localhost:3000';
const ADMIN_PIN = '1234';

// Helper for DB Access to verify state independent of API
const getDbOrder = (id) => new Promise((resolve, reject) => {
    db.get("SELECT * FROM orders WHERE id = ?", [id], (err, row) => {
        if (err) reject(err); else resolve(row);
    });
});

async function runE2E() {
    console.log("🚀 Starting End-to-End Verification...");

    // 1. ADMIN: Create Test Category
    console.log("\n[1] Admin: Creating Test Category...");
    let res = await fetch(`${BASE_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': ADMIN_PIN },
        body: JSON.stringify({ name: 'E2E Test Cat', description: 'Test', sort_order: 99 })
    });
    if (!res.ok) throw new Error('Create Category Failed');
    console.log("✅ Category Created");

    // Refresh to get ID (mocking UI refresh)
    res = await fetch(`${BASE_URL}/api/categories`);
    const cats = await res.json();
    const catId = cats.find(c => c.name === 'E2E Test Cat').id;

    // 2. ADMIN: Create Option Group (Matcha Type)
    console.log("\n[2] Admin: Creating Option Group & Advanced Option...");
    res = await fetch(`${BASE_URL}/api/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': ADMIN_PIN },
        body: JSON.stringify({ type: 'group', name: 'E2E Matcha', isMultiSelect: false, isRequired: true })
    });
    const grpData = await res.json();
    const grpId = grpData.id;

    // 3. ADMIN: Create Option "Fuji Test" with JSON Pricing
    // Size L = +5000, 1L3 = +10000. Base = 0.
    res = await fetch(`${BASE_URL}/api/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': ADMIN_PIN },
        body: JSON.stringify({
            type: 'option',
            groupId: grpId,
            name: 'Fuji Test',
            priceModifier: 0,
            priceModifiersJson: JSON.stringify({ "L": 5000, "1L3": 10000 })
        })
    });
    const optData = await res.json();
    const optId = optData.id;
    console.log("✅ Advanced Option Created (L=+5k, 1L3=+10k)");

    // 4. ADMIN: Create Product Linked to Group
    console.log("\n[3] Admin: Creating Product 'E2E Latte'...");
    res = await fetch(`${BASE_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': ADMIN_PIN },
        body: JSON.stringify({
            name: 'E2E Latte',
            categoryId: catId,
            description: 'Test',
            sizes: [{ size_name: 'M', price: 30000 }, { size_name: 'L', price: 35000 }],
            optionGroupIds: [grpId]
        })
    });
    const prodData = await res.json(); // May not return ID directly depending on API, let's fetch
    res = await fetch(`${BASE_URL}/api/products`);
    const prods = await res.json();
    const product = prods.find(p => p.name === 'E2E Latte');
    console.log(`✅ Product Created: ${product.name} (ID: ${product.id})`);

    // 5. CUSTOMER: Place Order (M Size + Fuji) -> Should be Base Price (30k) + Fuji (0) = 30k
    console.log("\n[4] Customer: Ordering Size M + Fuji (Expected: 30,000)...");
    let orderBody = {
        items: [{
            product: product,
            selectedSize: { size_name: 'M', price: 30000 },
            selectedOptions: [{ id: optId, name: 'Fuji Test', price_modifier: 0, price_modifiers_json: JSON.stringify({ "L": 5000, "1L3": 10000 }) }],
            quantity: 1,
            totalPrice: 30000
        }],
        total: 30000,
        method: 'cash'
    };

    res = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderBody)
    });
    let orderRes = await res.json();
    const orderIdM = orderRes.id;
    console.log(`✅ Order M Constants Placed (ID: ${orderIdM})`);

    // 6. CUSTOMER: Place Order (L Size + Fuji) -> Should be L Price (35k) + Fuji L Premium (5k) = 40k
    console.log("\n[5] Customer: Ordering Size L + Fuji (Expected: 40,000)...");

    // Simulate what Frontend sends: Logic must calculate total
    const sizeLPrice = 35000;
    const fujiLPremium = 5000;
    const expectedTotal = sizeLPrice + fujiLPremium;

    orderBody = {
        items: [{
            product: product,
            selectedSize: { size_name: 'L', price: 35000 },
            selectedOptions: [{ id: optId, name: 'Fuji Test', price_modifier: 0, price_modifiers_json: JSON.stringify({ "L": 5000, "1L3": 10000 }) }],
            quantity: 1,
            totalPrice: expectedTotal
        }],
        total: expectedTotal,
        method: 'cash'
    };

    res = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderBody)
    });
    orderRes = await res.json();
    const orderIdL = orderRes.id;
    console.log(`✅ Order L Advanced Placed (ID: ${orderIdL})`);

    // Verify DB
    const dbOrder = await getDbOrder(orderIdL);
    console.log("DB Order Row:", JSON.stringify(dbOrder));
    if (dbOrder.total !== 40000) throw new Error(`Pricing Error! Expected 40000, got ${dbOrder.total}`);
    console.log("✅ DB Verified: Price is correct.");

    // 7. KITCHEN: Workflow (Pick Up -> Preparing)
    console.log("\n[6] Kitchen: Worker picking up order...");
    const workerId = 1; // Assume generic worker
    res = await fetch(`${BASE_URL}/api/orders`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderIdL, status: 'preparing', worker_id: workerId })
    });
    if (!res.ok) throw new Error('Kitchen Pick Up Failed');

    // Verify Status
    const dbOrderPrep = await getDbOrder(orderIdL);
    if (dbOrderPrep.status !== 'preparing') throw new Error(`Status Error! Expected 'preparing', got ${dbOrderPrep.status}`);
    console.log("✅ Order is now PREPARING.");

    // 8. KITCHEN: Workflow (Complete)
    console.log("\n[7] Kitchen: completing order...");
    res = await fetch(`${BASE_URL}/api/orders`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderIdL, status: 'completed' })
    });
    if (!res.ok) throw new Error('Kitchen Complete Failed');

    // Verify Status
    const dbOrderDone = await getDbOrder(orderIdL);
    if (dbOrderDone.status !== 'completed') throw new Error(`Status Error! Expected 'completed', got ${dbOrderDone.status}`);
    console.log("✅ Order is now COMPLETED.");

    console.log("\n🌟 E2E VERIFICATION SCRIPT PASSED SUCCESSFULLY! 🌟");

    // Cleanup (Optional, but good practice to keep DB clean-ish or just leave for manual inspection)
}

runE2E().catch(e => console.error("❌ E2E FAILED:", e));
