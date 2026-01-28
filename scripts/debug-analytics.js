const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('matcha.db');

db.serialize(() => {
    // 1. Check Status Counts
    db.all("SELECT status, COUNT(*) as count FROM orders GROUP BY status", (err, rows) => {
        console.log("\n📊 Order Status Breakdown:");
        if (err) console.error(err);
        else console.table(rows);
    });

    // 2. Check Timestamps of Completed Orders
    db.all("SELECT id, created_at, status FROM orders WHERE status = 'completed' ORDER BY created_at DESC LIMIT 5", (err, rows) => {
        console.log("\n🕒 Recent Completed Orders:");
        console.table(rows);
    });

    // 3. Test Analytics Query (Week)
    const query = "SELECT items, total FROM orders WHERE status = 'completed' AND created_at >= datetime('now', '-7 days')";
    db.all(query, (err, rows) => {
        console.log("\n📈 Analytics Query Result (Count):", rows ? rows.length : 0);
        if (err) console.error("Query Error:", err);
    });
});
