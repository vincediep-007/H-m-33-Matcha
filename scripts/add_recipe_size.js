const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../matcha.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("Adding size_name to product_recipes...");

    // We will recreate the table to be clean, or just add column.
    // Adding column is safer if we want to keep data, but we might want to default to 'M' or whatever the first size is.
    // Actually, let's just add the column.

    db.run("ALTER TABLE product_recipes ADD COLUMN size_name TEXT", (err) => {
        if (err && err.message.includes('duplicate column')) {
            console.log("Column size_name already exists.");
        } else if (err) {
            console.error("Error adding column:", err.message);
        } else {
            console.log("Column added successfully.");
        }
    });
});

db.close();
