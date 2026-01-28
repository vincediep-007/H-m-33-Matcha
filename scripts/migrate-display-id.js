const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('matcha.db');

db.serialize(() => {
    // Add display_id column
    db.run("ALTER TABLE orders ADD COLUMN display_id INTEGER DEFAULT 1", (err) => {
        if (err) console.log("Column display_id might already exist or error:", err.message);
        else console.log("Added display_id column.");
    });
});
