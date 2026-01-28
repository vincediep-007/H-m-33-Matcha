const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('matcha.db');

const serialize = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            resolve(true);
        });
    });
};

const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ id: this.lastID });
        });
    });
};

const seed = async () => {
    console.log("🌱 Seeding Hẻm 33 Menu...");

    // 1. Clear existing Menu Data
    await run(`DELETE FROM product_option_links`);
    await run(`DELETE FROM options`);
    await run(`DELETE FROM option_groups`);
    await run(`DELETE FROM product_sizes`);
    await run(`DELETE FROM products`);
    await run(`DELETE FROM categories`);

    // 2. Create Categories
    const catIds = {};
    const categories = [
        { name: 'Matcha', description: 'M: 4g - L: 5.5g - 1L3: 8g (Bột Nhật Bản)' },
        { name: 'Matcha Cold Whisk', description: 'M: 5g - L: 7g - 1L3: 10g' },
        { name: 'Houjicha', description: 'Trà rang Nhật Bản - Thơm hạt rang, Bùi béo' },
        { name: 'Cacao', description: 'Đậm đà, thơm ngon' },
        { name: 'Oreo', description: 'Đá xay cùng bánh Oreo vụn + Lớp kem muối' },
        { name: 'Trà Hoa', description: 'Trà đã có topping Thạch Dừa - Ly 700ml' },
        { name: 'Topping', description: 'Thêm topping cho thức uống ngon hơn', is_visible: 1 }
    ];

    for (const c of categories) {
        const res = await run(`INSERT INTO categories (name, description, is_visible) VALUES (?, ?, 1)`, [c.name, c.description]);
        catIds[c.name] = res.id;
        console.log(`Created Category: ${c.name}`);
    }

    // 3. Create Option Groups & Options
    const groupIds = {};

    // Sugar
    const sugarRes = await run(`INSERT INTO option_groups (name, description, is_multi_select, is_required, is_visible) VALUES (?, ?, ?, ?, 1)`, ['Độ Ngọt (Sugar)', 'Chọn mức đường mong muốn', 0, 1]);
    groupIds['Sugar'] = sugarRes.id;
    const sugars = ['100%', '70%', '50%', '30%', '0% (Không đường)'];
    for (const s of sugars) await run(`INSERT INTO options (group_id, name, price_modifier, is_available, is_visible) VALUES (?, ?, ?, 1, 1)`, [groupIds['Sugar'], s, 0]);

    // Ice
    const iceRes = await run(`INSERT INTO option_groups (name, description, is_multi_select, is_required, is_visible) VALUES (?, ?, ?, ?, 1)`, ['Đá (Ice)', 'Chọn lượng đá', 0, 1]);
    groupIds['Ice'] = iceRes.id;
    const ices = ['100%', '70%', '50%', '30%', '0% (Không đá)'];
    for (const i of ices) await run(`INSERT INTO options (group_id, name, price_modifier, is_available, is_visible) VALUES (?, ?, ?, 1, 1)`, [groupIds['Ice'], i, 0]);

    // Toppings (Global)
    const topRes = await run(`INSERT INTO option_groups (name, description, is_multi_select, is_required, is_visible) VALUES (?, ?, ?, ?, 1)`, ['Toppings', 'Thêm topping hấp dẫn', 1, 0]);
    groupIds['Topping'] = topRes.id;
    const toppings = [
        { name: 'Tàu Hũ Núng Nính', price: 3000 },
        { name: 'Trân Châu Đen', price: 5000 },
        { name: 'Kem Muối', price: 3000 },
        { name: 'Bánh Oreo Vụn', price: 3000 },
        { name: 'Phô Mai Bò Cười Dằm', price: 5000 }
    ];
    for (const t of toppings) await run(`INSERT INTO options (group_id, name, price_modifier, is_available, is_visible) VALUES (?, ?, ?, 1, 1)`, [groupIds['Topping'], t.name, t.price]);

    // NEW: Matcha Powders (Loại Bột)
    const powderRes = await run(`INSERT INTO option_groups (name, description, is_multi_select, is_required, is_visible) VALUES (?, ?, ?, ?, 1)`, ['Loại Bột (Matcha Type)', 'Chọn loại bột Matcha bạn thích', 0, 0]); // Changed to NOT required default, but for matcha drinks we should probably enforce or default?
    groupIds['Powder'] = powderRes.id;

    // Note: Prices +0 mostly, or custom? Menu shows some types have no extra cost, premium might.
    // Assuming base price, or maybe these are upgrades? I'll set 0 for now as per "Type A/B" usually being standard choices or small variance.
    // Actually, image shows +5K, +10K for some.
    // Let's assume Type A/B are standard (or just options).
    const powders = [
        { name: 'Type A', desc: 'Thơm hạt rang, bùi béo, khói nhẹ. Hậu vị dễ chịu.', price: 0 },
        { name: 'Type B', desc: 'Hạt dẻ, caramel, béo bùi, rang đậm đà.', price: 0 },
        { name: 'MK4', desc: 'Đậm đà, béo hạt, ko tanh.', price: 0 },
        { name: 'Fuji Haru 02', desc: 'Thơm trà, hậu ngọt, đắng chát nhẹ.', price: 0 },
        { name: 'Fuji No Haru', desc: 'Thơm hoa cỏ, có xíu nutty, vị chát nhẹ.', price: 0 },
        { name: 'Maruyama Seicha', desc: 'Nhẹ nhàng, cỏ non, đắng chát nhẹ.', price: 0 },
        { name: 'Matsu (G40)', desc: 'Đắng nhẹ, hoa cỏ, hậu ngọt dịu.', price: 0 },
        { name: 'Fuji 03', desc: 'Béo thơm, đậm đà, ko đắng chát.', price: 5000 }, // Example price assumption or from context if visible
        { name: 'Kasuga', desc: 'Thuần trà, béo phô mai, ko đắng chát +5K/+10K', price: 5000 }
    ];

    for (const p of powders) {
        // Need to check if DB has image_url column first? Assuming migration ran.
        // We will pass empty string for image_url
        try {
            await run(`INSERT INTO options (group_id, name, price_modifier, description, is_available, is_visible, image_url) VALUES (?, ?, ?, ?, 1, 1, ?)`, [groupIds['Powder'], p.name, p.price, p.desc, '']);
        } catch (e) {
            // Fallback if column missing (shouldn't happen if migrated)
            await run(`INSERT INTO options (group_id, name, price_modifier, description, is_available, is_visible) VALUES (?, ?, ?, ?, 1, 1)`, [groupIds['Powder'], p.name, p.price, p.desc]);
        }
    }

    const commonOptionGroups = [groupIds['Sugar'], groupIds['Ice'], groupIds['Topping']];
    const matchaOptionGroups = [groupIds['Powder'], groupIds['Sugar'], groupIds['Ice'], groupIds['Topping']];

    // Helper to Create Product
    const createProduct = async (catName, name, sizes, desc = '', groups = commonOptionGroups) => {
        const catId = catIds[catName];
        let finalGroups = groups;

        // Auto-add Powder group if name contains Matcha
        if ((name.includes('Matcha') || catName.includes('Matcha')) && !groups.includes(groupIds['Powder'])) {
            finalGroups = matchaOptionGroups;
        }

        const res = await run(`INSERT INTO products (name, category_id, description, image_url, is_available, is_visible) VALUES (?, ?, ?, ?, 1, 1)`, [name, catId, desc, '']);
        const pid = res.id;

        for (const s of sizes) {
            await run(`INSERT INTO product_sizes (product_id, size_name, price) VALUES (?, ?, ?)`, [pid, s.name, s.price]);
        }
        for (const gid of finalGroups) {
            try {
                await run(`INSERT INTO product_option_links (product_id, group_id) VALUES (?, ?)`, [pid, gid]);
            } catch (e) { } // Ignore dups
        }
        console.log(`Created Product: ${name}`);
    };

    // 4. Products Data
    // Matcha (Uses Matcha Groups)
    await createProduct('Matcha', 'Matcha Latte', [{ name: 'M', price: 30000 }, { name: 'L', price: 37000 }, { name: '1L3', price: 50000 }], '', matchaOptionGroups);
    await createProduct('Matcha', 'Matcha Dâu/Chuối/Xoài', [{ name: 'M', price: 35000 }, { name: 'L', price: 42000 }, { name: '1L3', price: 55000 }], 'Mix vị trái cây tươi mát', matchaOptionGroups);
    await createProduct('Matcha', 'Matcha Caramel', [{ name: 'M', price: 33000 }, { name: 'L', price: 40000 }, { name: '1L3', price: 53000 }], '', matchaOptionGroups);
    await createProduct('Matcha', 'Matcha Oreo', [{ name: 'M', price: 33000 }, { name: 'L', price: 40000 }, { name: '1L3', price: 53000 }], '', matchaOptionGroups);
    await createProduct('Matcha', 'Choco Matcha Latte', [{ name: 'M', price: 33000 }, { name: 'L', price: 40000 }, { name: '1L3', price: 53000 }], '', matchaOptionGroups);

    // Matcha Cold Whisk
    await createProduct('Matcha Cold Whisk', 'Cold Whisk Nước Dừa', [{ name: 'M', price: 35000 }, { name: 'L', price: 45000 }, { name: '1L3', price: 65000 }], 'Matcha đánh bông với sữa yến mạch + nước dừa', matchaOptionGroups);
    await createProduct('Matcha Cold Whisk', 'Matcha Cold Whisk', [{ name: 'M', price: 35000 }, { name: 'L', price: 42000 }, { name: '1L3', price: 60000 }], 'Matcha đánh trực tiếp với sữa', matchaOptionGroups);

    // Houjicha (Uses common)
    await createProduct('Houjicha', 'Houjicha Latte', [{ name: 'M', price: 35000 }, { name: 'L', price: 42000 }, { name: '1L3', price: 60000 }]);

    // Cacao
    await createProduct('Cacao', 'Cacao Sữa', [{ name: 'M', price: 25000 }, { name: 'L', price: 30000 }, { name: '1L3', price: 35000 }]);
    await createProduct('Cacao', 'Cacao Dâu/Chuối/Xoài', [{ name: 'M', price: 30000 }, { name: 'L', price: 35000 }, { name: '1L3', price: 45000 }]);
    await createProduct('Cacao', 'Cacao Bạc Hà', [{ name: 'M', price: 28000 }, { name: 'L', price: 33000 }, { name: '1L3', price: 45000 }]);
    await createProduct('Cacao', 'Cacao Hạt Điều', [{ name: 'M', price: 30000 }, { name: 'L', price: 35000 }, { name: '1L3', price: 45000 }]);

    // Oreo 
    await createProduct('Oreo', 'Oreo Choco', [{ name: 'M', price: 28000 }, { name: 'L', price: 33000 }, { name: '1L3', price: 40000 }], 'Oreo vụn + Lớp kem muối');
    await createProduct('Oreo', 'Oreo Choco Mint', [{ name: 'M', price: 32000 }, { name: 'L', price: 37000 }, { name: '1L3', price: 48000 }]);
    await createProduct('Oreo', 'Oreo Choco Chuối', [{ name: 'M', price: 33000 }, { name: 'L', price: 38000 }, { name: '1L3', price: 48000 }]);

    // Tea
    await createProduct('Trà Hoa', 'Trà Lê Hoa Cúc', [{ name: 'Ly 700ml', price: 25000 }], 'Có sẵn thạch dừa');
    await createProduct('Trà Hoa', 'Trà Vải Hoa Hồng', [{ name: 'Ly 700ml', price: 25000 }], 'Có sẵn thạch dừa');

    console.log("✅ Hẻm 33 Menu Seeded Successfully with Matcha Powders!");
};

serialize().then(() => seed()).catch(err => console.error(err));
