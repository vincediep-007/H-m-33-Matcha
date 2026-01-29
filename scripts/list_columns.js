const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../matcha.db');
const db = new sqlite3.Database(dbPath);

const tables = ['categories', 'products', 'options', 'product_sizes', 'product_option_links'];

async function check() {
    for (const table of tables) {
        await new Promise(resolve => {
            db.all(`PRAGMA table_info(${table})`, [], (err, rows) => {
                console.log(`--- ${table} ---`);
                rows.forEach(r => console.log(`${r.name} (${r.type})`));
                console.log('');
                resolve();
            });
        });
    }
    db.close();
}

check();
