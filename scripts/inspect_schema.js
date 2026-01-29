const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../matcha.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT name, sql FROM sqlite_master WHERE type='table'", [], (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    rows.forEach(row => {
        console.log(`--- Table: ${row.name} ---`);
        console.log(row.sql);
        console.log('');
    });
    db.close();
});
