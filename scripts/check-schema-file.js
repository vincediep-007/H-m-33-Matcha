const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const db = new sqlite3.Database('matcha.db');

db.all("PRAGMA table_info(orders)", (err, rows) => {
    if (err) console.error(err);
    else {
        fs.writeFileSync('schema_utf8.txt', JSON.stringify(rows, null, 2), 'utf8');
        console.log("Schema written to schema_utf8.txt");
    }
});
