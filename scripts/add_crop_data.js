const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../matcha.db');
const database = new sqlite3.Database(dbPath);

console.log('Adding crop_data column to options table...');

database.run("ALTER TABLE options ADD COLUMN crop_data TEXT", (err) => {
    if (err) {
        console.log('Column might already exist or error:', err.message);
    } else {
        console.log('Added crop_data column.');
    }
    database.close();
});
