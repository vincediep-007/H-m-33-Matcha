const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../matcha.db');
const db = new sqlite3.Database(dbPath);

async function check() {
    let output = '';
    const tables = ['categories', 'products', 'product_sizes', 'options'];
    for (const table of tables) {
        await new Promise(resolve => {
            db.all(`SELECT * FROM ${table} LIMIT 2`, [], (err, rows) => {
                output += `--- ${table} ---\n`;
                output += JSON.stringify(rows, null, 2) + '\n\n';
                resolve();
            });
        });
    }
    fs.writeFileSync(path.resolve(__dirname, '../peek.txt'), output);
    db.close();
}

check();

