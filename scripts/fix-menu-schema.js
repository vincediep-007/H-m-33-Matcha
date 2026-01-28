const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../db/coffee_shop.db');
const db = new sqlite3.Database(dbPath);

function run(sql) {
    return new Promise((resolve, reject) => {
        db.run(sql, function (err) {
            if (err) resolve({ error: err.message }); // Resolve error to keep going
            else resolve({ changes: this.changes });
        });
    });
}

function get(sql) {
    return new Promise((resolve, reject) => {
        db.all(sql, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function main() {
    console.log("🛠️ Fixing Menu Schema & Data...");

    // 1. Fix "Topping0" Name
    console.log("1. Renaming 'Topping0' -> 'Toppings'...");
    const renameRes = await run("UPDATE option_groups SET name = 'Toppings' WHERE name = 'Topping0'");
    console.log("   -> " + (renameRes.changes ? "Renamed!" : "No need / Not found"));

    // 2. Add sort_order to options
    console.log("2. Adding 'sort_order' column to 'options'...");
    const colRes = await run("ALTER TABLE options ADD COLUMN sort_order INTEGER DEFAULT 0");
    if (colRes.error && colRes.error.includes("duplicate column")) {
        console.log("   -> Column already exists.");
    } else if (colRes.error) {
        console.error("   -> Error:", colRes.error);
    } else {
        console.log("   -> Added!");
    }

    // 3. Verify Columns (Check for image_url)
    console.log("3. Verifying columns...");
    const opts = await get("PRAGMA table_info(options)");
    const hasImage = opts.find(r => r.name === 'image_url');
    console.log("   -> options.image_url exists?", !!hasImage);

    const groups = await get("PRAGMA table_info(option_groups)");
    const hasGroupImage = groups.find(r => r.name === 'image_url');
    console.log("   -> option_groups.image_url exists?", !!hasGroupImage);

    db.close();
}

main().catch(console.error);
