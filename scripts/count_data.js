const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../matcha.db');
const db = new sqlite3.Database(dbPath);

const tables = [
    'categories',
    'products',
    'product_sizes',
    'option_groups',
    'options',
    'product_option_links'
];

async function check() {
    for (const table of tables) {
        const row = await new Promise(resolve => {
            db.get(`SELECT count(*) as count FROM ${table}`, [], (err, row) => {
                resolve(row || { count: 'Error/Missing' });
            });
        });
        console.log(`${table}: ${row.count}`);
    }
    db.close();
}

check();
