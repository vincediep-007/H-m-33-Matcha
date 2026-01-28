const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('matcha.db');

db.serialize(() => {
    console.log("Migrating Options Table...");
    db.run("ALTER TABLE options ADD COLUMN image_url TEXT", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log("Column 'image_url' already exists.");
            } else {
                console.error("Error adding column:", err.message);
            }
        } else {
            console.log("Successfully added 'image_url' to options table.");
        }
    });
});
