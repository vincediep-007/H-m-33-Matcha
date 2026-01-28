const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../matcha.db');

console.log('Opening DB at:', dbPath);
const database = new sqlite3.Database(dbPath);

console.log('Adding image_focus column to options table...');

database.run("ALTER TABLE options ADD COLUMN image_focus TEXT DEFAULT 'center'", (err) => {
    if (err) {
        console.log('Column might already exist or error:', err.message);
    } else {
        console.log('Added image_focus column.');
    }
    database.close();
});
