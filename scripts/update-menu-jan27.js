const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('matcha.db');

// Helper to run query as promise
const run = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
        if (err) reject(err); else resolve(this);
    });
});

const get = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) reject(err); else resolve(row);
    });
});

const all = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) reject(err); else resolve(rows);
    });
});

async function migrate() {
    console.log("Starting Menu Update...");

    // 1. Schema Update
    try {
        await run("ALTER TABLE options ADD COLUMN price_modifiers_json TEXT");
        console.log("Added price_modifiers_json column.");
    } catch (e) {
        console.log("Column price_modifiers_json likely exists.");
    }

    // 2. Toppings
    console.log("Configuring Toppings...");
    let toppingGroup = await get("SELECT id FROM option_groups WHERE name LIKE '%Topping%'");
    if (!toppingGroup) {
        const res = await run("INSERT INTO option_groups (name, description, is_multi_select, is_required) VALUES (?, ?, ?, ?)", ['Topping', 'Thêm topping', 1, 0]);
        toppingGroup = { id: res.lastID };
    }

    // Clear old toppings in this group to reset
    await run("DELETE FROM options WHERE group_id = ?", [toppingGroup.id]);

    const toppings = [
        { name: 'Tàu hủ núng nính', price: 3000 },
        { name: 'Trân châu đen', price: 5000 },
        { name: 'Kem muối', price: 3000 },
        { name: 'Bánh Oreo vụn', price: 3000 },
        { name: 'Phô mai bò cười dầm', price: 5000 }
    ];

    for (const t of toppings) {
        await run("INSERT INTO options (group_id, name, price_modifier, is_available) VALUES (?, ?, ?, ?)", [toppingGroup.id, t.name, t.price, 1]);
    }


    // 3. Sweetness (Ngọt)
    console.log("Configuring Sweetness...");
    let sweetGroup = await get("SELECT id FROM option_groups WHERE name LIKE '%Ngọt%' OR name LIKE '%Sweetness%'");
    if (!sweetGroup) {
        const res = await run("INSERT INTO option_groups (name, description, is_multi_select, is_required) VALUES (?, ?, ?, ?)", ['Độ ngọt (Sweetness)', 'Chọn loại đường', 0, 1]);
        sweetGroup = { id: res.lastID };
    }

    // Reset options
    await run("DELETE FROM options WHERE group_id = ?", [sweetGroup.id]);

    const sweets = [
        { name: 'Sữa đặc (Mặc định)', price: 0 },
        { name: 'Syrup Earl Grey', price: 0 },
        { name: 'Nước đường', price: 0 },
        { name: 'Không đường', price: 0 }
    ];

    for (const s of sweets) {
        await run("INSERT INTO options (group_id, name, price_modifier, is_available) VALUES (?, ?, ?, ?)", [sweetGroup.id, s.name, s.price, 1]);
    }

    // 4. Matcha Types (Loại Bột)
    console.log("Configuring Matcha Types...");
    let matchaGroup = await get("SELECT id FROM option_groups WHERE name LIKE '%Loại Bột%'");
    if (!matchaGroup) {
        const res = await run("INSERT INTO option_groups (name, description, is_multi_select, is_required) VALUES (?, ?, ?, ?)", ['Loại Bột (Matcha Type)', 'Chọn loại Matcha', 0, 0]);
        matchaGroup = { id: res.lastID };
    }

    // Ensure Type A / Type B / Fuji are here
    // We update existing or insert new. simplified: Check existence by name
    const types = [
        { name: 'Type A' },
        { name: 'Type B' },
        { name: 'Fuji Haru 03', extra: true }
    ];

    for (const t of types) {
        const exist = await get("SELECT id FROM options WHERE group_id = ? AND name = ?", [matchaGroup.id, t.name]);
        if (!exist) {
            let json = null;
            // Fuji 03 Special Pricing: L +5k, 1L3 +10k. Base price 0? Or is base price dependent? check user req "Fuji 03 is + 5k in L, but 10k in 1L3"
            // Assuming base M is +0 (included in drink price?) or we leave base modifier as is. User didn't specify base price.
            // Implied: Standard matcha drink uses standard powder. Choosing Fuji upgrades it.
            if (t.name === 'Fuji Haru 03') {
                json = JSON.stringify({ "L": 5000, "1L3": 10000 });
            }

            await run("INSERT INTO options (group_id, name, price_modifier, price_modifiers_json, is_available) VALUES (?, ?, ?, ?, ?)",
                [matchaGroup.id, t.name, 0, json, 1]
            );
        } else if (t.name === 'Fuji Haru 03') {
            // Update existing Fuji
            const json = JSON.stringify({ "L": 5000, "1L3": 10000 });
            await run("UPDATE options SET price_modifiers_json = ? WHERE id = ?", [json, exist.id]);
        }
    }


    // 5. Build Links (Toppings to All, Sweetness to All, Matcha Group to Matcha products)
    console.log("Linking Groups...");
    const products = await all("SELECT id, name, option_group_ids FROM products");

    for (const p of products) {
        let currentGroups = [];
        try { currentGroups = JSON.parse(p.option_group_ids || '[]'); } catch (e) { }

        // Add Topping & Sweetness to ALL (Simplification, can refine later)
        if (!currentGroups.includes(toppingGroup.id)) currentGroups.push(toppingGroup.id);
        if (!currentGroups.includes(sweetGroup.id)) currentGroups.push(sweetGroup.id);

        // Add Matcha Group to Matcha products
        if (p.name.toLowerCase().includes('matcha')) {
            if (!currentGroups.includes(matchaGroup.id)) currentGroups.push(matchaGroup.id);
        }

        await run("UPDATE products SET option_group_ids = ? WHERE id = ?", [JSON.stringify(currentGroups), p.id]);
    }

    console.log("Migration Complete.");
}

migrate();
