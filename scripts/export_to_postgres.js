const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../matcha.db');
const db = new sqlite3.Database(dbPath);
const outputPath = path.resolve(__dirname, '../postgres_seed.sql');

const tables = [
    'settings',
    'categories',
    'option_groups',
    'ingredients',
    'products',
    'options',
    'product_sizes',
    'product_option_links',
    'product_recipes',
    'orders',
    'surveys'
];

const stream = fs.createWriteStream(outputPath);

function getRows(table) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM ${table}`, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function exportData() {
    console.log("Exporting data to postgres_seed.sql...");

    // 1. Drop and Create Tables (Schema)
    stream.write(`
--PostgreSQL Seed File
--Generated from SQLite

DROP TABLE IF EXISTS surveys;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS product_recipes;
DROP TABLE IF EXISTS product_option_links;
DROP TABLE IF EXISTS product_sizes;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS ingredients;
DROP TABLE IF EXISTS options;
DROP TABLE IF EXISTS option_groups;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS settings;

CREATE TABLE IF NOT EXISTS settings(
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );

CREATE TABLE categories(
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        is_visible INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        image_url TEXT
    );

CREATE TABLE option_groups(
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        is_multi_select INTEGER DEFAULT 0,
        is_required INTEGER DEFAULT 0,
        is_visible INTEGER DEFAULT 1
    );

CREATE TABLE options(
        id SERIAL PRIMARY KEY,
        group_id INTEGER REFERENCES option_groups(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        price_modifier INTEGER DEFAULT 0,
        is_available INTEGER DEFAULT 1,
        is_visible INTEGER DEFAULT 1,
        image_url TEXT,
        price_modifiers_json TEXT,
        sort_order INTEGER DEFAULT 0,
        image_focus TEXT,
        crop_data TEXT
    );

CREATE TABLE products(
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES categories(id),
        name TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        is_available INTEGER DEFAULT 1,
        is_visible INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE ingredients(
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    cost_per_gram REAL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_sizes(
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        size_name TEXT NOT NULL,
        price INTEGER NOT NULL
    );

CREATE TABLE product_option_links(
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        group_id INTEGER REFERENCES option_groups(id) ON DELETE CASCADE,
        PRIMARY KEY(product_id, group_id)
    );

CREATE TABLE product_recipes(
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id),
        ingredient_id INTEGER, --Weak link if ingredients table not present
    quantity REAL NOT NULL,
        size_name TEXT
);

CREATE TABLE orders(
            id SERIAL PRIMARY KEY,
            items TEXT,
            total INTEGER,
            details TEXT,
            worker_id INTEGER,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            display_id INTEGER
        );

CREATE TABLE surveys(
            id SERIAL PRIMARY KEY,
            order_id INTEGER,
            worker_id INTEGER,
            quality INTEGER,
            time INTEGER,
            manner INTEGER,
            overall INTEGER,
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
`);



    // 2. Export Data Sequentially
    for (const table of tables) {
        try {
            const rows = await getRows(table);
            if (rows.length > 0) {
                console.log(`Writing data for ${table} (${rows.length} rows)...`);
                stream.write(`\n-- Data for ${table}\n`);
                rows.forEach(row => {
                    const columns = Object.keys(row).join(', ');
                    const values = Object.values(row).map(v => {
                        if (v === null) return 'NULL';
                        if (typeof v === 'string') {
                            // Fix date format: "2026-01-28, 05:13:33" -> "2026-01-28 05:13:33"
                            let cleaned = v;
                            if (v.match(/^\d{4}-\d{2}-\d{2}, \d{2}:\d{2}:\d{2}$/)) {
                                cleaned = v.replace(', ', ' ');
                            }
                            return `'${cleaned.replace(/'/g, "''")}'`;
                        }
                        if (typeof v === 'boolean') return v ? '1' : '0';
                        return v;
                    }).join(', ');
                    stream.write(`INSERT INTO ${table} (${columns}) VALUES (${values});\n`);
                });
            }
        } catch (err) {
            console.error(`Error exporting ${table}:`, err);
        }
    }

    console.log("Export complete!");

    stream.write(`
-- Final Sequence Resets
SELECT setval(pg_get_serial_sequence('categories', 'id'), coalesce(max(id), 1)) FROM categories;
SELECT setval(pg_get_serial_sequence('products', 'id'), coalesce(max(id), 1)) FROM products;
SELECT setval(pg_get_serial_sequence('product_sizes', 'id'), coalesce(max(id), 1)) FROM product_sizes;
SELECT setval(pg_get_serial_sequence('options', 'id'), coalesce(max(id), 1)) FROM options;
SELECT setval(pg_get_serial_sequence('option_groups', 'id'), coalesce(max(id), 1)) FROM option_groups;
SELECT setval(pg_get_serial_sequence('ingredients', 'id'), coalesce(max(id), 1)) FROM ingredients;
SELECT setval(pg_get_serial_sequence('orders', 'id'), coalesce(max(id), 1)) FROM orders;
SELECT setval(pg_get_serial_sequence('surveys', 'id'), coalesce(max(id), 1)) FROM surveys;
`);

    stream.end();
}


db.serialize(() => {
    exportData();
});
