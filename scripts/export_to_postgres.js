const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../matcha.db');
const db = new sqlite3.Database(dbPath);
const outputPath = path.resolve(__dirname, '../postgres_seed.sql');

const tables = [
    'categories',
    'options',
    'option_groups',
    'products',
    'product_sizes',
    'product_option_links',
    'product_recipes',
    'ingredients'
    // 'orders', 'order_items' // Skip sales data for clean deploy? Or include? Let's skip for now, usually users want menu.
];

const stream = fs.createWriteStream(outputPath);

db.serialize(() => {
    console.log("Exporting data to postgres_seed.sql...");

    // 1. Drop and Create Tables (Schema)
    // We'll generate generic CREATE TABLE statements compatible with Postgres

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
        is_visible BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0
    );

CREATE TABLE option_groups(
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        is_multi_select BOOLEAN DEFAULT false,
        is_required BOOLEAN DEFAULT false,
        is_visible BOOLEAN DEFAULT true
    );

CREATE TABLE options(
        id SERIAL PRIMARY KEY,
        group_id INTEGER REFERENCES option_groups(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        price_modifier INTEGER DEFAULT 0,
        is_available BOOLEAN DEFAULT true,
        is_visible BOOLEAN DEFAULT true
    );

CREATE TABLE products(
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES categories(id),
        name TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        is_available BOOLEAN DEFAULT true,
        is_visible BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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


    // 2. Export Data
    let completed = 0;

    tables.forEach(table => {
        db.all(`SELECT * FROM ${table}`, [], (err, rows) => {
            if (err) {
                console.error(`Error reading ${table}:`, err);
                return;
            }

            if (rows.length > 0) {
                stream.write(`\n-- Data for ${table}\n`);
                rows.forEach(row => {
                    const columns = Object.keys(row).join(', ');
                    const values = Object.values(row).map(v => {
                        if (v === null) return 'NULL';
                        if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
                        return v;
                    }).join(', ');
                    stream.write(`INSERT INTO ${table} (${columns}) VALUES (${values});\n`);
                });
            }

            completed++;
            if (completed === tables.length) {
                console.log("Export complete!");
                stream.end();
            }
        });
    });
});
