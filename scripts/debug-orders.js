const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../db/coffee_shop.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT items FROM orders ORDER BY created_at DESC LIMIT 5", [], (err, rows) => {
    if (err) throw err;
    console.log("--- Latest 5 Orders JSON ---");
    rows.forEach((row, i) => {
        console.log(`Order ${i + 1}:`, row.items);
    });
    db.close();
});
